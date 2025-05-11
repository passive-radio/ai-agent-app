// Type declarations for modules without type definitions

declare module '@common/types' {
  export interface LLMModel {
    id: string;
    name: string;
    provider: string;
    description: string;
    enabledToolCalls: boolean;
  }

  export interface Message {
    id: string;
    role: string;
    content: string;
    timestamp: string;
  }

  export interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    createdAt: string;
    updatedAt: string;
    modelId: string;
  }

  export interface ChatRequest {
    sessionId: string;
    message: string;
    modelId: string;
  }

  export interface CreateSessionRequest {
    title?: string;
    modelId?: string;
  }

  export interface UpdateSessionRequest {
    title?: string;
    modelId?: string;
  }

  export enum SSEEventType {
    MESSAGE = 'message',
    THINKING = 'thinking',
    ERROR = 'error',
    DONE = 'done'
  }

  export interface ChatHistoryExport {
    sessions: ChatSession[];
  }
}

declare module '@common/utils' {
  import { ChatSession } from '@common/types';
  
  export function extractTitleFromContent(content: string): string;
  export function sessionsToYaml(sessions: ChatSession[]): string;
  export function yamlToSessions(yaml: string): ChatSession[];
}

// Declare missing modules
declare module 'uuid';
declare module 'js-yaml';

// LangChain declarations
declare module 'langchain/agents' {
  export interface AgentStep {}
  export interface AgentAction {
    tool: string;
    toolInput: any;
  }
  export interface AgentFinish {}
  export interface CreateReactAgentParams {
    llm: any;
    tools: any[];
    prompt: string;
  }
  export function createReactAgent(params: CreateReactAgentParams): any;
  export class AgentExecutor {
    static fromAgentAndTools(params: {
      agent: any;
      tools: any[];
      verbose?: boolean;
      returnIntermediateSteps?: boolean;
    }): AgentExecutor;
    
    invoke(params: {
      input: string;
    }, options?: any): Promise<any>;
  }
}

// declare module '@langchain/openai' {
//   export interface ChatOpenAICallOptions {}
//   export class ChatOpenAI<T = ChatOpenAICallOptions> {
//     constructor(options: {
//       model: string;
//       temperature: number;
//       streaming: boolean;
//       openAIApiKey: string;
//       maxTokens?: number;
//       configuration?: {
//         basePath: string;
//         defaultHeaders: Record<string, string>;
//       };
//     });
//   }
// }

// Fastify declarations
declare module 'fastify' {
  export interface FastifyInstance {
    register: (plugin: any, options?: any) => FastifyInstance;
    get: (path: string, handler: (request?: any, reply?: any) => any) => void;
    post: <T = any>(path: string, handler: (request?: any, reply?: any) => any) => void;
    put: <T = any>(path: string, handler: (request?: any, reply?: any) => any) => void;
    delete: (path: string, handler: (request?: any, reply?: any) => any) => void;
    listen: (options: { port: number; host: string }) => Promise<void>;
    log: {
      error: (err: any) => void;
    };
  }

  export interface FastifyRequest {
    params: any;
    body: any;
  }

  export interface FastifyReply {
    raw: {
      writeHead: (statusCode: number, headers: Record<string, string>) => void;
      write: (data: string) => void;
      end: () => void;
    };
  }

  interface FastifyOptions {
    logger?: {
      transport?: {
        target: string;
        options?: {
          translateTime?: string;
          ignore?: string;
        };
      };
    };
  }

  const fastify: {
    (options?: FastifyOptions): FastifyInstance;
  };
  
  export default fastify;
}

// Plugin declarations
declare module '@fastify/cors' {
  interface CorsOptions {
    origin?: string | string[];
    methods?: string[];
    credentials?: boolean;
  }
  
  const cors: {
    (options?: CorsOptions): any;
  };
  
  export default cors;
}

// Declare module-alias
declare module 'module-alias' {
  function addAliases(aliases: Record<string, string>): void;
  export { addAliases };
  export default { addAliases };
} 