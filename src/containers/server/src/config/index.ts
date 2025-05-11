/**
 * Server configuration
 */
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

interface ServerConfig {
  port: number;
  host: string;
  nodeEnv: string;
  isProd: boolean;
  isDev: boolean;
  corsOrigin: string[];
}

interface OpenRouterConfig {
  apiKey: string;
  defaultModel: string;
}

interface DatabaseConfig {
  url: string;
}

interface ToolServicesConfig {
  braveApiKey: string;
}

interface Config {
  server: ServerConfig;
  openRouter: OpenRouterConfig;
  database: DatabaseConfig;
  toolServices: ToolServicesConfig;
}

// Server configuration
const server: ServerConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  isDev: process.env.NODE_ENV !== 'production',
  corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000', 'http://127.0.0.1:3000'],
};

// OpenRouter configuration
const openRouter: OpenRouterConfig = {
  apiKey: process.env.OPENROUTER_API_KEY || '',
  defaultModel: process.env.OPENROUTER_DEFAULT_MODEL || 'openai/gpt-4.1',
};

// Database configuration
const database: DatabaseConfig = {
  url: process.env.DATABASE_URL || 'mongodb://mongo:27017/ai-agent-chat',
};

// Tool services configuration
const toolServices: ToolServicesConfig = {
  braveApiKey: process.env.BRAVE_API_KEY || '',
};

// Export configuration
const config: Config = {
  server,
  openRouter,
  database,
  toolServices,
};

export default config;
