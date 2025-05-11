/**
 * Model service for managing LLM models
 */
import { LLMModel } from '@common/types';
import { ModelController } from '../controllers/model.controller';

export class ModelService {
  private modelController: ModelController;

  constructor() {
    this.modelController = new ModelController();
  }

  /**
   * Get all available models
   * @returns List of models
   */
  async getModels(): Promise<LLMModel[]> {
    return this.modelController.getModels();
  }

  /**
   * Get a model by ID
   * @param id Model ID
   * @returns Model or null if not found
   */
  async getModelById(id: string): Promise<LLMModel | null> {
    return this.modelController.getModelById(id);
  }

  /**
   * Get the default model
   * @returns Default model
   */
  async getDefaultModel(): Promise<LLMModel> {
    return this.modelController.getDefaultModel();
  }
}
