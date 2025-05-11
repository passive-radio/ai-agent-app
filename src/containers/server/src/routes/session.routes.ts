/**
 * Session API routes
 */
import { FastifyInstance } from 'fastify';
import { CreateSessionRequest, UpdateSessionRequest } from '@common/types';
import { SessionController } from '../controllers/session.controller';

/**
 * Session routes
 * @param fastify Fastify instance
 */
async function sessionRoutes(fastify: FastifyInstance) {
  const sessionController = new SessionController();

  // Get all sessions
  fastify.get('/', async () => {
    return sessionController.getSessions();
  });

  // Get a specific session by ID
  fastify.get('/:id', async (request: any) => {
    const { id } = request.params;
    return sessionController.getSessionById(id);
  });

  // Create a new session
  fastify.post<{ Body: CreateSessionRequest }>('/', async (request) => {
    const { title, modelId } = request.body;
    return sessionController.createSession(title, modelId);
  });

  // Update a session
  fastify.put<{ Params: { id: string }, Body: UpdateSessionRequest }>('/:id', async (request) => {
    const { id } = request.params;
    const { title, modelId } = request.body;
    return sessionController.updateSession(id, title, modelId);
  });

  // Delete a session
  fastify.delete('/:id', async (request: any) => {
    const { id } = request.params;
    return sessionController.deleteSession(id);
  });
}

export default sessionRoutes;
