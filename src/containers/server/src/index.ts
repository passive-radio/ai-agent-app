/**
 * Main entry point for the AI Agent Chat Server
 */
// Register module aliases first
import './register-paths';

import Fastify from 'fastify';
import cors from '@fastify/cors';
import config from './config';
import { registerRoutes } from './routes';

// Create Fastify instance
const server = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

// Register CORS - 簡素化して確実に動作するようにする
server.register(cors, {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// Register routes
registerRoutes(server);

// Start the server
const start = async () => {
  try {
    await server.listen({
      port: config.server.port,
      host: config.server.host,
    });
    
    console.log(`Server is running on ${config.server.host}:${config.server.port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
