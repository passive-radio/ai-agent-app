/**
 * API routes registration
 */
import { FastifyInstance } from 'fastify';
import chatRoutes from './chat.routes';
import modelRoutes from './model.routes';
import sessionRoutes from './session.routes';
import historyRoutes from './history.routes';

/**
 * Register all API routes
 * @param server Fastify server instance
 */
export function registerRoutes(server: FastifyInstance) {
  // Health check route
  server.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // API routes
  server.register(chatRoutes, { prefix: '/api/chat' });
  server.register(modelRoutes, { prefix: '/api/models' });
  server.register(sessionRoutes, { prefix: '/api/sessions' });
  server.register(historyRoutes, { prefix: '/api/history' });
}
