/**
 * Common types for the AI Agent Chat Service
 */

/**
 * Message type representing a single message in a chat
 */
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

/**
 * Chat session type representing a single chat session
 */
export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  modelId: string;
}

/**
 * LLM Model configuration
 */
export interface LLMModel {
  id: string;
  name: string;
  provider: string;
  description?: string;
}

/**
 * Chat request payload
 */
export interface ChatRequest {
  sessionId: string;
  message: string;
  modelId: string;
}

/**
 * Chat response payload
 */
export interface ChatResponse {
  type: 'message' | 'thinking' | 'error';
  content: string;
  messageId?: string;
}

/**
 * Session creation request
 */
export interface CreateSessionRequest {
  title?: string;
  modelId: string;
}

/**
 * Session update request
 */
export interface UpdateSessionRequest {
  title?: string;
  modelId?: string;
}

/**
 * Chat history import/export format
 */
export interface ChatHistoryExport {
  version: string;
  sessions: ChatSession[];
  exportedAt: string;
}

/**
 * ReAct agent types
 */
export interface AgentAction {
  tool: string;
  toolInput: Record<string, any>;
  log: string;
}

export interface AgentFinish {
  returnValues: {
    output: string;
  };
  log: string;
}

export type AgentStep = {
  action: AgentAction;
  observation: string;
} | {
  action: AgentFinish;
};

/**
 * SSE Event types
 */
export enum SSEEventType {
  MESSAGE = 'message',
  THINKING = 'thinking',
  ERROR = 'error',
  DONE = 'done'
}

export interface SSEEvent {
  type: SSEEventType;
  data: any;
}
