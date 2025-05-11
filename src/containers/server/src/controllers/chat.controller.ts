/**
 * Chat controller for handling chat requests and responses
 * Version 2 - Using StreamableHTTP MCP Transport
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
import { tool } from "@langchain/core/tools";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { z } from "zod";

// Interface representing an MCP Tool Server Configuration
interface MCPToolServerConfig {
  url: string;
  reconnect: {
    enabled: boolean;
    maxAttempts: number;
    delayMs: number;
  };
}

// Interface representing MCP tool server connections
interface MCPServerConnections {
  [serverName: string]: {
    client: Client;
    transport: StreamableHTTPClientTransport;
    connected: boolean;
  };
}

export class ChatController {
  private sessionService: SessionService;
  private modelService: ModelService;
  private mcpServers: Record<string, MCPToolServerConfig>;
  private mcpConnections: MCPServerConnections;

  constructor() {
    this.sessionService = new SessionService();
    this.modelService = new ModelService();
    this.mcpConnections = {};

    // Define MCP servers configuration
    this.mcpServers = {
      time: {
        url: "http://time:3000/",
        reconnect: {
          enabled: true,
          maxAttempts: 2,
          delayMs: 2000,
        },
      },
      "web-search": {
        url: "http://web-search:3000/",
        reconnect: {
          enabled: true,
          maxAttempts: 3,
          delayMs: 2000,
        },
      },
      calculator: {
        url: "http://calculator:3000/",
        reconnect: {
          enabled: true,
          maxAttempts: 2,
          delayMs: 2000,
        },
      },
      playwright: {
        url: "http://playwright:3000/mcp",
        reconnect: {
          enabled: true,
          maxAttempts: 3,
          delayMs: 2000,
        },
      },
    };

    console.log(
      "MCP configuration initialized, connections will be established when needed"
    );
  }

  /**
   * Initialize MCP connections and load tools
   */
  private async connectToMCPServer(
    serverName: string,
    config: MCPToolServerConfig
  ): Promise<Client | null> {
    try {
      console.log(`Connecting to MCP server "${serverName}" at ${config.url}`);

      // Create transport
      const transport = new StreamableHTTPClientTransport(new URL(config.url), {
        sessionId: undefined, // Let the server generate one
      });

      // Create client
      const client = new Client({
        name: `ai-agent-chat-client-${serverName}`,
        version: "0.0.1",
      });

      // Set up error handler
      client.onerror = (error) => {
        console.error(`MCP client error for "${serverName}":`, error);
      };

      // Connect to the server
      await client.connect(transport);

      // Store the connection
      this.mcpConnections[serverName] = {
        client,
        transport,
        connected: true,
      };

      console.log(`Successfully connected to MCP server "${serverName}"`);
      return client;
    } catch (error) {
      console.error(`Failed to connect to MCP server "${serverName}":`, error);
      return null;
    }
  }

  /**
   * Get tools from all configured MCP servers
   */
  private async getMCPTools(): Promise<any[]> {
    const tools: any[] = [];
    const connectedServers: string[] = [];

    try {
      console.log("Attempting to connect to MCP tool servers...");

      // Connect to each server and get tools
      const connectionPromises = Object.entries(this.mcpServers).map(
        async ([serverName, config]) => {
          // Connect if not already connected
          if (
            !this.mcpConnections[serverName] ||
            !this.mcpConnections[serverName].connected
          ) {
            const client = await this.connectToMCPServer(serverName, config);
            if (!client) return;
          }

          const connection = this.mcpConnections[serverName];
          if (!connection || !connection.connected) return;

          try {
            // Get tools metadata from the server
            const toolsMetadata = await connection.client.listTools();

            console.log("----------------------------------------------");
            console.log("toolsMetadata", toolsMetadata);
            console.log("toolsMetadata.length", toolsMetadata.length);
            console.log("toolsMetadata[0]", toolsMetadata[0]);
            console.log("----------------------------------------------");

            // Convert MCP tools to LangChain tools
            if (
              toolsMetadata &&
              toolsMetadata.tools &&
              Array.isArray(toolsMetadata.tools)
            ) {
              for (const toolMetadata of toolsMetadata.tools) {
                // Format tool name to be more user-friendly for LLM
                const toolName = toolMetadata.name.replace(/-/g, "_");
                const formattedName = `${serverName}_${toolName}`;

                // [todo] Use the inputSchema, annotations, and description to create and call tool properly
                const inputSchema = toolMetadata.inputSchema;
                const annotations = toolMetadata.annotations;
                const description = toolMetadata.description;

                // Create dynamic tool description based on metadata
                let toolDescription =
                  description || `Tool from ${serverName} server`;

                // Add information about server and expected input format
                toolDescription += `\n\nThis is a tool from the ${serverName} server.`;

                // Add parameter details from inputSchema if available
                if (
                  inputSchema &&
                  inputSchema.type === "object" &&
                  inputSchema.properties
                ) {
                  const paramDetails = Object.entries(inputSchema.properties)
                    .map(([paramName, paramProps]: [string, any]) => {
                      let paramDesc = `- ${paramName}: ${
                        paramProps.description || "Parameter"
                      }`;
                      if (paramProps.enum) {
                        paramDesc += ` (Valid values: ${paramProps.enum.join(
                          ", "
                        )})`;
                      }
                      if (paramProps.type) {
                        paramDesc += ` (Type: ${paramProps.type})`;
                      }
                      return paramDesc;
                    })
                    .join("\n");

                  toolDescription += `\n\nParameters:\n${paramDetails}`;
                } else {
                  // Add generic parameter info based on server type
                  if (
                    serverName === "time" &&
                    toolMetadata.name === "current-time"
                  ) {
                    toolDescription += `\nTo use this tool, provide a timezone name like 'Asia/Tokyo', 'America/New_York', or 'UTC' to get the current time in that timezone.`;
                  } else if (serverName === "calculator") {
                    toolDescription += `\nTo use this calculator, provide a mathematical expression like '2+2', '(3*4)/2', etc.`;
                  } else if (serverName === "web-search") {
                    toolDescription += `\nTo use this web search tool, provide a search query.`;
                  } else {
                    toolDescription += `\nTo use this tool, provide input as a simple string.`;
                  }
                }

                // Add examples if available in annotations
                if (
                  annotations &&
                  annotations.examples &&
                  Array.isArray(annotations.examples)
                ) {
                  toolDescription += "\n\nExamples:";
                  annotations.examples.forEach(
                    (example: any, index: number) => {
                      if (example.input && example.output) {
                        toolDescription += `\n${index + 1}. Input: "${
                          example.input
                        }" → Output: "${example.output}"`;
                      }
                    }
                  );
                }

                // Using detailed schema information for the tool
                const mcpTool = tool(
                  async (input: { input: string }) => {
                    try {
                      // Log the call attempt
                      console.log(
                        `Making MCP tool call to server: ${serverName}, tool: ${toolMetadata.name}`
                      );

                      // Format the input based on MCP protocol and inputSchema requirements
                      let params: any;

                      // Parse LLM-provided arguments if they are complex
                      try {
                        // Check if the input.input is actually a JSON string with multiple parameters
                        const parsedInput = JSON.parse(input.input);

                        if (
                          typeof parsedInput === "object" &&
                          parsedInput !== null
                        ) {
                          console.log("Parsed complex input:", parsedInput);
                          params = parsedInput;
                        } else {
                          params = { input: input.input };
                        }
                      } catch (e) {
                        // Not JSON, use normal handling
                        // Check if any additional arguments were provided by the LLM
                        const anyInput = input as any;
                        if (
                          anyInput.args &&
                          typeof anyInput.args === "object"
                        ) {
                          console.log(
                            "Using args object directly:",
                            anyInput.args
                          );
                          params = anyInput.args;
                        } else if (
                          inputSchema &&
                          inputSchema.type === "object" &&
                          inputSchema.properties
                        ) {
                          // Extract parameter info from schema
                          const paramNames = Object.keys(
                            inputSchema.properties
                          );
                          if (paramNames.length > 0) {
                            // For web-search, use 'query' as the primary parameter
                            if (
                              serverName === "web-search" &&
                              paramNames.includes("query")
                            ) {
                              params = { query: input.input };

                              // Add default values for other parameters
                              if (
                                inputSchema.properties &&
                                "count" in inputSchema.properties
                              ) {
                                params.count = 5; // Default count
                              }
                            } else {
                              const primaryParamName = paramNames[0];
                              params = { [primaryParamName]: input.input };
                            }
                            console.log(
                              `Using schema-defined parameter: ${
                                Object.keys(params)[0]
                              }`
                            );
                          } else {
                            params = { input: input.input };
                          }
                        } else {
                          // Fall back to standard parameter names based on server type
                          if (
                            serverName === "time" &&
                            toolMetadata.name === "current-time"
                          ) {
                            params = { timezone: input.input };
                          } else if (
                            serverName === "web-search" &&
                            toolMetadata.name === "brave_search"
                          ) {
                            params = { query: input.input };
                          } else {
                            params = { input: input.input };
                          }
                        }
                      }

                      // Handle special type conversions based on inputSchema
                      if (inputSchema && inputSchema.properties) {
                        Object.entries(params).forEach(([key, value]) => {
                          const propSchema =
                            inputSchema.properties &&
                            (inputSchema.properties[key] as any);
                          if (propSchema) {
                            // Convert string to number if schema expects a number
                            if (
                              propSchema.type === "number" ||
                              propSchema.type === "integer"
                            ) {
                              if (typeof value === "string") {
                                const num = Number(value);
                                if (!isNaN(num)) {
                                  params[key] = num;
                                }
                              }
                            }
                          }
                        });
                      }

                      console.log(`Calling tool with params:`, params);

                      // Prepare tool call with proper format for SDK 0.14+
                      const toolCall = {
                        name: toolMetadata.name,
                        arguments: params,
                      };

                      // The complete JSON-RPC request format (for reference)
                      const jsonRpcFormat = {
                        jsonrpc: "2.0",
                        method: "tools/call",
                        params: toolCall,
                        id: Math.floor(Math.random() * 1000000).toString(),
                      };

                      console.log(
                        `JSON-RPC request format:`,
                        JSON.stringify(jsonRpcFormat, null, 2)
                      );
                      console.log(`Final tool call format:`, toolCall);

                      // Call the MCP tool with the correct object format (not string)
                      // @ts-ignore - Bypass TypeScript type checking for MCP client
                      const result = await (connection.client as any).callTool(
                        toolCall
                      );

                      return typeof result === "string"
                        ? result
                        : JSON.stringify(result);
                    } catch (error) {
                      console.error(
                        `Error calling tool ${toolMetadata.name} on server ${serverName}:`,
                        error
                      );
                      return `Error: ${error}`;
                    }
                  },
                  {
                    name: formattedName,
                    description: toolDescription,
                    schema: z.object({
                      input: z.string().describe(
                        inputSchema && inputSchema.properties
                          ? Object.entries(inputSchema.properties)
                              .map(
                                ([name, prop]: [string, any]) =>
                                  `${name}: ${prop.description || name}${
                                    prop.enum
                                      ? ` (possible values: ${prop.enum.join(
                                          ", "
                                        )})`
                                      : ""
                                  }`
                              )
                              .join(". ")
                          : serverName === "time" &&
                            toolMetadata.name === "current-time"
                          ? `A timezone name like 'Asia/Tokyo', 'America/New_York', 'UTC', etc.`
                          : serverName === "calculator"
                          ? `A mathematical expression to calculate (e.g., '2+2', '3*4', 'sqrt(16)')`
                          : serverName === "web-search"
                          ? `A search query to look up information on the web`
                          : `Input for ${toolMetadata.name}.`
                      ),
                    }),
                  }
                );

                tools.push(mcpTool);
              }
            }

            connectedServers.push(serverName);
          } catch (error) {
            console.error(
              `Error getting tools from MCP server "${serverName}":`,
              error
            );
          }
        }
      );

      // Wait for all connection attempts to complete
      await Promise.all(connectionPromises);

      console.log(
        `Successfully loaded ${
          tools.length
        } MCP tools from servers: ${connectedServers.join(", ")}`
      );
      return tools;
    } catch (error) {
      console.error("Error in getMCPTools:", error);
      return [];
    }
  }

  /**
   * Clean up MCP connections
   */
  private async closeMCPConnections(): Promise<void> {
    for (const [serverName, connection] of Object.entries(
      this.mcpConnections
    )) {
      if (connection.connected) {
        try {
          await connection.transport.close();
          await connection.client.close();
          connection.connected = false;
          console.log(`Closed connection to MCP server "${serverName}"`);
        } catch (error) {
          console.error(
            `Error closing connection to MCP server "${serverName}":`,
            error
          );
        }
      }
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
      let tools: any[] = [];
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
              // Process LangGraph agent messages
              for (const msg of chunk.agent.messages) {
                if (msg && msg.kwargs && msg.kwargs.content) {
                  // Append to full response
                  responseContent += msg.kwargs.content;

                  // Send incremental update with the same message ID
                  this.sendMessageEvent(
                    reply,
                    msg.kwargs.content,
                    responseMessageId
                  );
                } else if (msg && msg.lc === 1 && msg.kwargs?.content) {
                  const content = msg.kwargs.content;
                  responseContent += content;
                  this.sendMessageEvent(reply, content, responseMessageId);
                } else if (msg && typeof msg.content === "string") {
                  responseContent += msg.content;
                  this.sendMessageEvent(reply, msg.content, responseMessageId);
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
              // Process LangGraph iterations
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
                // Handle tool action results
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
                // Handle tool actions
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
            // Handle steps format
            else if (chunk.steps !== undefined && Array.isArray(chunk.steps)) {
              // Process steps
              if (chunk.steps.length > 0) {
                const lastStep = chunk.steps[chunk.steps.length - 1];

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
                } else if (lastStep.result) {
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
            // Handle direct output format
            else if (chunk.output !== undefined) {
              const outputContent =
                typeof chunk.output === "string"
                  ? chunk.output
                  : JSON.stringify(chunk.output);

              responseContent += outputContent;
              this.sendMessageEvent(reply, outputContent, responseMessageId);
            }
            // Handle message array chunks
            else if (
              chunk.messages &&
              Array.isArray(chunk.messages) &&
              chunk.messages.length > 0
            ) {
              const lastMessage = chunk.messages[chunk.messages.length - 1];

              if (lastMessage) {
                // Handle tool calls
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
          }
        }

        // Ensure the final assistant response is sent to the client at least once
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
      } finally {
        // Close MCP connections when done
        await this.closeMCPConnections();
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
  }

  /**
   * Flush the reply to ensure data is sent immediately
   * @param reply Fastify reply object
   */
  private flushReply(reply: FastifyReply): void {
    try {
      // NodeJSのHTTP.ServerResponseのflushHeaders()メソッドを使用
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
