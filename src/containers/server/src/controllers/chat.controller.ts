/**
 * Chat controller for handling chat requests and responses
 */
import { FastifyReply } from "fastify";
import { v4 as uuidv4 } from "uuid";
import { ChatOpenAI } from "@langchain/openai";
import { SSEEventType } from "@common/types";
import { SessionService } from "../services/session.service";
import { ModelService } from "../services/model.service";
import config from "../config";
import { HumanMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { GraphRecursionError } from "@langchain/langgraph";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { StructuredToolInterface } from "@langchain/core/tools";

export class ChatController {
  private sessionService: SessionService;
  private modelService: ModelService;
  private mcpClient: MultiServerMCPClient;

  constructor() {
    this.sessionService = new SessionService();
    this.modelService = new ModelService();

    // Initialize the MCP client with our services
    this.mcpClient = new MultiServerMCPClient({
      // Global configuration
      throwOnLoadError: false, // Don't throw on errors, just log them
      prefixToolNameWithServerName: true, // Prefix tool names with server names
      additionalToolNamePrefix: "mcp", // Add 'mcp' prefix to all tools

      // Server configuration - using SSE transport since we have HTTP servers
      mcpServers: {
        time: {
          transport: "sse",
          url: "http://time:3000", // コンテナ名:内部ポート（Docker内部通信）
          reconnect: {
            enabled: true,
            maxAttempts: 2, // 試行回数を増やす
            delayMs: 2000, // 再試行の間隔を長くする
          },
        },
        "web-search": {
          transport: "sse",
          url: "http://web-search:3000", // コンテナ名:内部ポート（Docker内部通信）
          reconnect: {
            enabled: true,
            maxAttempts: 3,
            delayMs: 2000,
          },
        },
        // fetch: {
        //   transport: "sse",
        //   url: "http://fetch:3000", // コンテナ名:内部ポート（Docker内部通信）
        //   reconnect: {
        //     enabled: true,
        //     maxAttempts: 2,
        //     delayMs: 2000,
        //   },
        // },
        calculator: {
          transport: "sse",
          url: "http://calculator:3000", // コンテナ名:内部ポート（Docker内部通信）
          reconnect: {
            enabled: true,
            maxAttempts: 2,
            delayMs: 2000,
          },
        },
        playwright: {
          transport: "sse",
          url: "http://playwright:3000", // コンテナ名:内部ポート（Docker内部通信）
          reconnect: {
            enabled: true,
            maxAttempts: 3,
            delayMs: 2000,
          },
        },
      },
    });

    // Initialize the MCP client (no need to call explicit connect method)
    console.log(
      "MCP client initialized, will connect automatically when getTools is called"
    );
  }

  /**
   * Initialize the MCP client and get tools
   */
  private async getMCPTools(): Promise<StructuredToolInterface[]> {
    try {
      // Get tools from all MCP servers (this will connect automatically)
      console.log("Attempting to connect to MCP tool servers...");

      try {
        // Get tools from all MCP servers (this will connect automatically)
        const mcpTools = await this.mcpClient.getTools();
        console.log(`Successfully loaded ${mcpTools.length} MCP tools`);
        return mcpTools;
      } catch (error) {
        console.error("Error getting MCP tools:", error);
        return [];
      }
    } catch (error) {
      console.error("Error in getMCPTools:", error);
      return [];
    }
  }

  /**
   * Stream chat response using SSE
   * @param sessionId Session ID
   * @param message User message
   * @param modelId Model ID
   * @param reply Fastify reply object for streaming response
   */
  async streamChatResponse(
    sessionId: string,
    message: string,
    modelId: string,
    reply: FastifyReply
  ): Promise<void> {
    try {
      // Get session and model
      const session = await this.sessionService.getSessionById(sessionId);
      if (!session) {
        this.sendErrorEvent(reply, `Session not found: ${sessionId}`);
        return;
      }

      const model = await this.modelService.getModelById(modelId);
      if (!model) {
        this.sendErrorEvent(reply, `Model not found: ${modelId}`);
        return;
      }

      // Create message ID
      const messageId = uuidv4();

      // Add user message to session
      await this.sessionService.addMessage(sessionId, {
        id: messageId,
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
      });

      // Create LLM instance
      const llm = new ChatOpenAI({
        model: model.id,
        temperature: 0.1,
        maxTokens: 5000,
        streaming: true,
        openAIApiKey: config.openRouter.apiKey,
        configuration: {
          baseURL: "https://openrouter.ai/api/v1",
          defaultHeaders: {
            "HTTP-Referer": "https://ai-agent-chat.example.com",
            "X-Title": "AI Agent Chat",
          },
        },
      });

      // Get MCP tools
      let tools: StructuredToolInterface[] = [];
      let agentGraph;
      let toolCallsEnabled = model.enabledToolCalls === true;

      if (toolCallsEnabled) {
        try {
          // Get tools from MCP client
          this.sendThinkingEvent(reply, "Loading MCP tools...");
          tools = await this.getMCPTools();
          console.log(`Loaded ${tools.length} MCP tools`);

          if (tools.length > 0) {
            this.sendThinkingEvent(
              reply,
              `Loaded ${tools.length} tools from MCP servers`
            );

            // Create ReAct agent using LangGraph with MCP tools
            agentGraph = createReactAgent({
              llm,
              tools,
              messageModifier:
                "You're a helpful AI assistant. Use the provided tools when necessary to answer the user's question.",
            });
          } else {
            this.sendThinkingEvent(
              reply,
              "No tools were loaded, using direct LLM instead"
            );
            toolCallsEnabled = false;
          }
        } catch (error) {
          console.error("Error loading MCP tools:", error);
          this.sendThinkingEvent(
            reply,
            "Error loading tools, using direct LLM instead"
          );
          toolCallsEnabled = false;
        }
      } else {
        console.log(
          `Model ${model.id} does not support tool calls, using direct LLM`
        );
      }

      // Send thinking event
      this.sendThinkingEvent(reply, "Thinking...");

      // Initialize response content
      let responseContent = ""; // Will store the full accumulated response
      let currentMessageId = messageId;

      try {
        let stream;
        try {
          // Use the LangGraph agent if tools are enabled, otherwise use direct LLM
          if (toolCallsEnabled && agentGraph) {
            this.sendThinkingEvent(
              reply,
              "Using agent with tool capabilities..."
            );
            stream = await agentGraph.stream(
              {
                messages: [new HumanMessage(message)],
              },
              {
                recursionLimit: 10, // Equivalent to maxIterations in the old AgentExecutor
              }
            );
          } else {
            // Skip straight to direct LLM if tools not enabled
            stream = await llm.stream([new HumanMessage(message)]);
          }
        } catch (agentError) {
          if (toolCallsEnabled && agentGraph) {
            console.error(
              "Agent streaming error, falling back to direct LLM:",
              agentError
            );
            this.sendThinkingEvent(
              reply,
              "Agent encountered an error, using direct LLM instead..."
            );
          } else {
            console.error("LLM streaming error:", agentError);
            this.sendThinkingEvent(
              reply,
              "Retrying with fallback configuration..."
            );
          }

          // Fallback to direct LLM with different settings if needed
          stream = await llm.stream([new HumanMessage(message)]);
        }

        // Generate a stable message ID for the entire response
        const responseMessageId = uuidv4();

        // Process the stream
        for await (const chunk of stream) {
          console.log("Stream chunk:", JSON.stringify(chunk));

          // Safely handle different chunk structures
          if (chunk && typeof chunk === "object") {
            // Handle direct content chunks
            if (chunk.content) {
              // Get chunk content and append to accumulated response
              const chunkContent =
                typeof chunk.content === "string"
                  ? chunk.content
                  : JSON.stringify(chunk.content);

              // Append to full response
              responseContent += chunkContent;

              // Send incremental update with the same message ID for all chunks
              this.sendMessageEvent(reply, chunkContent, responseMessageId);
            }
            // Handle agent-style chunks from LangGraph
            else if (
              chunk.agent &&
              chunk.agent.messages &&
              Array.isArray(chunk.agent.messages)
            ) {
              // ReAct Agentのチャンクをより詳細にログ
              console.log(
                "Processing LangGraph agent chunk with messages:",
                JSON.stringify(
                  chunk.agent.messages.map((m) => ({
                    type: m.type,
                    hasContent: m.kwargs?.content ? true : false,
                  }))
                )
              );

              // ログして実際の構造を確認
              console.log(
                "First message raw structure:",
                JSON.stringify(chunk.agent.messages[0])
              );

              // 受信データの形式を明確にログ出力
              console.log(
                "IMPORTANT: Analyzing agent chunk messages structure"
              );

              for (const msg of chunk.agent.messages) {
                // メッセージ構造を詳細に分析
                if (msg && msg.kwargs && msg.kwargs.content) {
                  // Append to full response
                  responseContent += msg.kwargs.content;

                  // Send incremental update with the same message ID
                  this.sendMessageEvent(
                    reply,
                    msg.kwargs.content,
                    responseMessageId
                  );
                  console.log(
                    "Found content in kwargs.content:",
                    msg.kwargs.content
                  );
                } else if (msg && msg.lc === 1 && msg.kwargs?.content) {
                  // 先ほどのログの例に合わせたケース
                  const content = msg.kwargs.content;
                  responseContent += content;
                  this.sendMessageEvent(reply, content, responseMessageId);
                  console.log("Found content in LangChain format:", content);
                } else if (msg && typeof msg.content === "string") {
                  // 直接contentフィールドがある場合
                  responseContent += msg.content;
                  this.sendMessageEvent(reply, msg.content, responseMessageId);
                  console.log("Found direct content field:", msg.content);
                } else if (
                  msg &&
                  msg.constructor === Object &&
                  Object.prototype.hasOwnProperty.call(msg, "content")
                ) {
                  // contentプロパティが直接存在する場合
                  const content = String(msg.content);
                  responseContent += content;
                  this.sendMessageEvent(reply, content, responseMessageId);
                  console.log("Found content property:", content);
                } else {
                  // 構造をさらに詳しくログに残して調査
                  console.log(
                    "Message structure for analysis:",
                    JSON.stringify(msg)
                  );
                  // オブジェクトの場合はキーを確認
                  if (msg && typeof msg === "object") {
                    console.log("Available keys in message:", Object.keys(msg));
                    // contentを含むキーを探す
                    for (const key of Object.keys(msg)) {
                      if (key.includes("content") && msg[key]) {
                        const content = String(msg[key]);
                        responseContent += content;
                        this.sendMessageEvent(
                          reply,
                          content,
                          responseMessageId
                        );
                        console.log(`Found content in '${key}':`, content);
                        break;
                      }
                    }
                  }
                }
                // Handle tool calls if present
                if (
                  msg &&
                  msg.kwargs &&
                  msg.kwargs.tool_calls &&
                  msg.kwargs.tool_calls.length > 0
                ) {
                  const toolCall = msg.kwargs.tool_calls[0];
                  this.sendThinkingEvent(
                    reply,
                    `Using tool: ${toolCall.name} with input: ${JSON.stringify(
                      toolCall.args
                    )}`
                  );
                }
              }
            }
            // Handle additional LangGraph output formats
            else if (chunk.iterations !== undefined) {
              console.log(
                "Processing LangGraph iterations chunk:",
                JSON.stringify(chunk)
              );
              // イテレーションチャンクから最終出力を探す
              if (chunk.iterations.length > 0) {
                const lastIteration =
                  chunk.iterations[chunk.iterations.length - 1];
                if (lastIteration.result && lastIteration.result.output) {
                  const output = lastIteration.result.output;
                  const outputContent =
                    typeof output === "string"
                      ? output
                      : JSON.stringify(output);

                  responseContent += outputContent;
                  this.sendMessageEvent(
                    reply,
                    outputContent,
                    responseMessageId
                  );
                }
                // action_resultが含まれている場合も処理
                else if (lastIteration.action_result) {
                  const actionResult = lastIteration.action_result;
                  const resultContent =
                    typeof actionResult === "string"
                      ? actionResult
                      : JSON.stringify(actionResult);

                  this.sendThinkingEvent(
                    reply,
                    `Tool result: ${resultContent}`
                  );
                }
                // actionが含まれている場合（ツール呼び出し）
                else if (lastIteration.action) {
                  const action = lastIteration.action;
                  this.sendThinkingEvent(
                    reply,
                    `Using tool: ${
                      action.name || "unknown"
                    } with input: ${JSON.stringify(action.args || {})}`
                  );
                }
              }
            }
            // 返答が steps として提供される場合
            else if (chunk.steps !== undefined && Array.isArray(chunk.steps)) {
              console.log("Processing steps chunk:", JSON.stringify(chunk));

              // 最後のステップから内容を抽出
              if (chunk.steps.length > 0) {
                const lastStep = chunk.steps[chunk.steps.length - 1];

                // 異なる形式のステップに対応
                if (lastStep.output) {
                  const outputContent =
                    typeof lastStep.output === "string"
                      ? lastStep.output
                      : JSON.stringify(lastStep.output);

                  responseContent += outputContent;
                  this.sendMessageEvent(
                    reply,
                    outputContent,
                    responseMessageId
                  );
                }
                // 最終的な結果がある場合
                else if (lastStep.result) {
                  const resultContent =
                    typeof lastStep.result === "string"
                      ? lastStep.result
                      : JSON.stringify(lastStep.result);

                  responseContent += resultContent;
                  this.sendMessageEvent(
                    reply,
                    resultContent,
                    responseMessageId
                  );
                }
              }
            }
            // Handle direct output format from LangGraph
            else if (chunk.output !== undefined) {
              console.log(
                "Processing direct output chunk:",
                JSON.stringify(chunk)
              );
              const outputContent =
                typeof chunk.output === "string"
                  ? chunk.output
                  : JSON.stringify(chunk.output);

              responseContent += outputContent;
              this.sendMessageEvent(reply, outputContent, responseMessageId);
            }
            // Handle regular message array chunks
            else if (
              chunk.messages &&
              Array.isArray(chunk.messages) &&
              chunk.messages.length > 0
            ) {
              const lastMessage = chunk.messages[chunk.messages.length - 1];

              if (lastMessage) {
                // Handle tool usage (thinking events)
                if (lastMessage.tool_calls && lastMessage.tool_calls.length) {
                  const toolCall = lastMessage.tool_calls[0];
                  this.sendThinkingEvent(
                    reply,
                    `Using tool: ${toolCall.name} with input: ${JSON.stringify(
                      toolCall.args
                    )}`
                  );
                }
                // Handle tool responses
                else if (lastMessage.name) {
                  this.sendThinkingEvent(
                    reply,
                    `Tool output: ${lastMessage.content}`
                  );
                }
                // Handle final AI response
                else if (lastMessage.content) {
                  // Append to full response
                  responseContent += lastMessage.content;

                  // Send incremental update with the same message ID
                  this.sendMessageEvent(
                    reply,
                    lastMessage.content,
                    responseMessageId
                  );
                }
              }
            }
            // その他の形式のチャンク（未知の形式）をデバッグ
            else {
              console.log("Unknown chunk format:", Object.keys(chunk));
              // 最後の手段として、chunk自体をJSONにして送信
              if (Object.keys(chunk).length > 0) {
                const fallbackContent = `\n\n[Debug] Received data: ${JSON.stringify(
                  chunk,
                  null,
                  2
                )}`;
                this.sendThinkingEvent(reply, fallbackContent);
              }
            }
          }
        }

        // Ensure the final assistant response is sent to the client at least
        // once. In some edge-cases (e.g. when the streaming chunks do not
        // contain a `content` field) the loop above might not have emitted any
        // `message` events. Guard against that by emitting the accumulated
        // `responseContent` right here if it has not been sent yet.
        if (responseContent) {
          this.sendMessageEvent(reply, responseContent, responseMessageId);
        }

        // Add assistant message to session
        await this.sessionService.addMessage(sessionId, {
          id: responseMessageId, // Use the same ID we used for streaming
          role: "assistant",
          content: responseContent,
          timestamp: new Date().toISOString(),
        });

        // Send done event
        this.sendDoneEvent(reply);
      } catch (error) {
        if (error instanceof GraphRecursionError) {
          this.sendErrorEvent(
            reply,
            "Agent reached maximum number of steps without completing the task"
          );
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error("Error in streamChatResponse:", error);
      this.sendErrorEvent(
        reply,
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Send SSE message event
   * @param reply Fastify reply object
   * @param content Message content
   * @param messageId Message ID
   */
  private sendMessageEvent(
    reply: FastifyReply,
    content: string,
    messageId: string
  ): void {
    reply.raw.write(`event: ${SSEEventType.MESSAGE}\n`);
    reply.raw.write(`data: ${JSON.stringify({ content, messageId })}\n\n`);
    // Ensure data is sent immediately
    this.flushReply(reply);
  }

  /**
   * Send SSE thinking event
   * @param reply Fastify reply object
   * @param content Thinking content
   */
  private sendThinkingEvent(reply: FastifyReply, content: string): void {
    reply.raw.write(`event: ${SSEEventType.THINKING}\n`);
    reply.raw.write(`data: ${JSON.stringify({ content })}\n\n`);
    // Ensure data is sent immediately
    this.flushReply(reply);
  }

  /**
   * Send SSE error event
   * @param reply Fastify reply object
   * @param error Error message
   */
  private sendErrorEvent(reply: FastifyReply, error: string): void {
    reply.raw.write(`event: ${SSEEventType.ERROR}\n`);
    reply.raw.write(`data: ${JSON.stringify({ error })}\n\n`);
    reply.raw.write(`event: ${SSEEventType.DONE}\n`);
    reply.raw.write(`data: {}\n\n`);
    // Ensure data is sent immediately
    this.flushReply(reply);
    // Don't end the connection, keep it open for future messages
    // reply.raw.end();
  }

  /**
   * Send SSE done event
   * @param reply Fastify reply object
   */
  private sendDoneEvent(reply: FastifyReply): void {
    reply.raw.write(`event: ${SSEEventType.DONE}\n`);
    reply.raw.write(`data: {}\n\n`);
    // Ensure data is sent immediately
    this.flushReply(reply);
    // Don't end the connection, keep it open for future messages
    // reply.raw.end();
  }

  /**
   * Flush the reply to ensure data is sent immediately
   * @param reply Fastify reply object
   */
  private flushReply(reply: FastifyReply): void {
    try {
      // NodeJSのHTTP.ServerResponseのflushHeaders()メソッドを使用
      // TypeScriptの型定義を無視して実行
      const rawResponse = reply.raw as any;
      if (rawResponse.flush && typeof rawResponse.flush === "function") {
        rawResponse.flush();
      } else if (
        rawResponse.flushHeaders &&
        typeof rawResponse.flushHeaders === "function"
      ) {
        rawResponse.flushHeaders();
      }
    } catch (error) {
      console.error("Error trying to flush response:", error);
    }
  }
}
