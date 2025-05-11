/**
 * Model controller for handling model-related operations
 */
import { LLMModel } from '@common/types';
import config from '../config';

export class ModelController {
  // List of available models
  private models: LLMModel[] = [
    {
      id: 'openai/gpt-4.1-nano',
      name: 'GPT-4.1 Nano',
      provider: 'OpenAI',
      description: 'OpenAIのGPTシリーズで最も低遅延、低コストのモデル。低レイテンシーが要求されるアプリケーションに最適。',
      enabledToolCalls: true,
    },
    {
      id: 'arcee-ai/caller-large',
      name: 'Arcee AI: Caller Large',
      provider: 'Arcee AI',
      description: 'Caller Large is Arcee\'s specialist "function‑calling" SLM built to orchestrate external tools and APIs',
      enabledToolCalls: true,
    },
    {
      id: 'meta-llama/llama-4-maverick:free',
      name: 'Llama 4 Maverick (Free)',
      provider: 'Meta',
      description: 'Metaの最新のモデル。高度な自然言語理解と推論能力を持つ',
      enabledToolCalls: false,
    },
    {
      id: 'deepseek/deepseek-chat-v3-0324:free',
      name: 'DeepSeek Chat v3.0324 (Free)',
      provider: 'DeepSeek',
      description: 'DeepSeekの最新のモデル。高度な自然言語理解と推論能力を持つ',
      enabledToolCalls: false,
    },
    {
      id: 'openai/gpt-4.1',
      name: 'GPT-4.1',
      provider: 'OpenAI',
      description: 'OpenAIの比較的新しいモデル。高度な自然言語理解と推論能力を持つ',
      enabledToolCalls: true,
    },
    {
      id: 'openai/o3-mini-high',
      name: 'gpt-o3-mini-high',
      provider: 'OpenAI',
      description: 'OpenAI o3-mini-high is the same model as o3-mini with reasoning_effort set to high. o3-mini is a cost-efficient language model optimized for STEM reasoning tasks, particularly excelling in science, mathematics, and coding.',
      enabledToolCalls: true,
    },
    {
      id: 'google/gemini-2.5-flash-preview',
      name: 'Gemini 2.5 Flash',
      provider: 'Google',
      description: 'Googleの最新のモデル。高度な自然言語理解と推論能力を持つ',
      enabledToolCalls: true,
    },
    {
      id: 'google/gemini-2.0-flash-001',
      name: 'Google Gemini 2.0 Flash',
      provider: 'Google',
      description: 'Googleの高性能モデル。複雑な理解と会話に優れる',
      enabledToolCalls: true,
    },
    {
      id: 'anthropic/claude-3.7-sonnet',
      name: 'Anthropic Claude 3.7 Sonnet',
      provider: 'Anthropic',
      description: 'Anthropicの高性能モデル。特にコーディングに優れる',
      enabledToolCalls: true,
    },
  ];

  /**
   * Get all available models
   * @returns List of models
   */
  async getModels(): Promise<LLMModel[]> {
    return this.models;
  }

  /**
   * Get a model by ID
   * @param id Model ID
   * @returns Model or null if not found
   */
  async getModelById(id: string): Promise<LLMModel | null> {
    const model = this.models.find(model => model.id === id);
    return model || null;
  }

  /**
   * Get the default model
   * @returns Default model
   */
  async getDefaultModel(): Promise<LLMModel> {
    const defaultModelId = config.openRouter.defaultModel;
    const defaultModel = await this.getModelById(defaultModelId);
    
    if (defaultModel) {
      return defaultModel;
    }
    
    // Fallback to first model if default not found
    return this.models[0];
  }
}
