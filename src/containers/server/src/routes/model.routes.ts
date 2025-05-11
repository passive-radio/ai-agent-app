/**
 * Model API routes
 */
import { FastifyInstance } from 'fastify';
import { ModelController } from '../controllers/model.controller';

/**
 * Model routes
 * @param fastify Fastify instance
 */
async function modelRoutes(fastify: FastifyInstance) {
  const modelController = new ModelController();

  // Get all available models
  fastify.get('/', async () => {
    return modelController.getModels();
  });

  // Get a specific model by ID
  fastify.get('/:id', async (request: any) => {
    const { id } = request.params;
    return modelController.getModelById(id);
  });
}

export default modelRoutes;
