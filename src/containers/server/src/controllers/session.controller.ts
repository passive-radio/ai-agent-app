/**
 * Session controller for handling session-related operations
 */
import { v4 as uuidv4 } from 'uuid';
import { ChatSession, Message } from '@common/types';
import { extractTitleFromContent } from '@common/utils';
import { ModelService } from '../services/model.service';
import { SessionService } from '../services/session.service';

export class SessionController {
  private sessionService: SessionService;
  private modelService: ModelService;

  constructor() {
    this.sessionService = new SessionService();
    this.modelService = new ModelService();
  }

  /**
   * Get all sessions
   * @returns List of sessions
   */
  async getSessions(): Promise<ChatSession[]> {
    return this.sessionService.getSessions();
  }

  /**
   * Get a session by ID
   * @param id Session ID
   * @returns Session or null if not found
   */
  async getSessionById(id: string): Promise<ChatSession | null> {
    return this.sessionService.getSessionById(id);
  }

  /**
   * Create a new session
   * @param title Optional session title
   * @param modelId Model ID
   * @returns Created session
   */
  async createSession(title?: string, modelId?: string): Promise<ChatSession> {
    // Get default model if not provided
    if (!modelId) {
      const defaultModel = await this.modelService.getDefaultModel();
      modelId = defaultModel.id;
    }

    // Generate session ID
    const sessionId = uuidv4();

    // Create timestamp
    const timestamp = new Date().toISOString();

    // Create welcome message
    const welcomeMessage: Message = {
      id: uuidv4(),
      role: 'system',
      content: 'Welcome to the chat! How can I assist you today?',
      timestamp,
    };

    // Create session
    const session: ChatSession = {
      id: sessionId,
      title: title || 'New Chat',
      messages: [welcomeMessage],
      createdAt: timestamp,
      updatedAt: timestamp,
      modelId,
    };

    // Save session
    await this.sessionService.saveSession(session);

    return session;
  }

  /**
   * Update a session
   * @param id Session ID
   * @param title New title (optional)
   * @param modelId New model ID (optional)
   * @returns Updated session or null if not found
   */
  async updateSession(
    id: string,
    title?: string,
    modelId?: string
  ): Promise<ChatSession | null> {
    // Get session
    const session = await this.sessionService.getSessionById(id);
    if (!session) {
      return null;
    }

    // Update fields
    if (title !== undefined) {
      session.title = title;
    }

    if (modelId !== undefined) {
      session.modelId = modelId;
    }

    // Update timestamp
    session.updatedAt = new Date().toISOString();

    // Save session
    await this.sessionService.saveSession(session);

    return session;
  }

  /**
   * Delete a session
   * @param id Session ID
   * @returns Success status
   */
  async deleteSession(id: string): Promise<{ success: boolean }> {
    const success = await this.sessionService.deleteSession(id);
    return { success };
  }
}
