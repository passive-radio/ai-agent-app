/**
 * History API routes
 */
import { FastifyInstance } from 'fastify';
import { HistoryController } from '../controllers/history.controller';

/**
 * History routes
 * @param fastify Fastify instance
 */
async function historyRoutes(fastify: FastifyInstance) {
  const historyController = new HistoryController();

  // Export all chat history as YAML
  fastify.get('/export', async () => {
    return historyController.exportHistory();
  });

  // Import chat history from YAML
  fastify.post('/import', async (request: any) => {
    const { yamlContent } = request.body;
    return historyController.importHistory(yamlContent);
  });
}

export default historyRoutes;
