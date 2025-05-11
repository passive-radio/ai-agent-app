/**
 * Chat API routes
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ChatRequest } from '@common/types';
import { ChatController } from '../controllers/chat.controller';

/**
 * Chat routes
 * @param fastify Fastify instance
 */
async function chatRoutes(fastify: FastifyInstance) {
  const chatController = new ChatController();

  // Handle GET request for EventSource connection
  fastify.get('/', async (request, reply) => {
    const { sessionId, modelId, message } = request.query as { sessionId: string; modelId: string; message?: string };

    if (!sessionId || !modelId) {
      reply.code(400).send({ error: 'Missing required query parameters: sessionId, modelId' });
      return;
    }

    // Set headers for SSE
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': 'http://localhost:3000',
      'Access-Control-Allow-Credentials': 'true',
    });

    // If message is provided in the query, process it
    if (message) {
      await chatController.streamChatResponse(sessionId, message, modelId, reply);
    } else {
      // Otherwise, just establish the connection and wait for POST request
      reply.raw.write(`event: thinking\n`);
      reply.raw.write(`data: ${JSON.stringify({ content: 'Connection established' })}\n\n`);
    }
  });

  // Send a message to the AI agent and get a streaming response
  fastify.post<{ Body: ChatRequest }>('/', async (request, reply) => {
    const { sessionId, message, modelId } = request.body;

    // Set headers for SSE
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': 'http://localhost:3000',
      'Access-Control-Allow-Credentials': 'true',
    });

    // Process the chat request and stream the response
    await chatController.streamChatResponse(sessionId, message, modelId, reply);
  });
}

export default chatRoutes;
