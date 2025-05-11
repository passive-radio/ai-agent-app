/**
 * Session service for managing chat sessions
 */
import fs from 'fs';
import path from 'path';
import { ChatSession, Message } from '@common/types';

export class SessionService {
  private sessionsDir: string;

  constructor() {
    // Create sessions directory if it doesn't exist
    this.sessionsDir = path.join(__dirname, '../../data/sessions');
    this.ensureSessionsDir();
  }

  /**
   * Ensure sessions directory exists
   */
  private ensureSessionsDir(): void {
    if (!fs.existsSync(this.sessionsDir)) {
      fs.mkdirSync(this.sessionsDir, { recursive: true });
    }
  }

  /**
   * Get all sessions
   * @returns List of sessions
   */
  async getSessions(): Promise<ChatSession[]> {
    this.ensureSessionsDir();
    
    const files = fs.readdirSync(this.sessionsDir);
    const sessions: ChatSession[] = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(this.sessionsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        try {
          const session = JSON.parse(content) as ChatSession;
          sessions.push(session);
        } catch (error) {
          console.error(`Error parsing session file ${file}:`, error);
        }
      }
    }
    
    // Sort by updated date (newest first)
    return sessions.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  /**
   * Get a session by ID
   * @param id Session ID
   * @returns Session or null if not found
   */
  async getSessionById(id: string): Promise<ChatSession | null> {
    const filePath = path.join(this.sessionsDir, `${id}.json`);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as ChatSession;
    } catch (error) {
      console.error(`Error reading session ${id}:`, error);
      return null;
    }
  }

  /**
   * Save a session
   * @param session Session to save
   */
  async saveSession(session: ChatSession): Promise<void> {
    this.ensureSessionsDir();
    
    const filePath = path.join(this.sessionsDir, `${session.id}.json`);
    const content = JSON.stringify(session, null, 2);
    
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  /**
   * Delete a session
   * @param id Session ID
   * @returns Success status
   */
  async deleteSession(id: string): Promise<boolean> {
    const filePath = path.join(this.sessionsDir, `${id}.json`);
    
    if (!fs.existsSync(filePath)) {
      return false;
    }
    
    try {
      fs.unlinkSync(filePath);
      return true;
    } catch (error) {
      console.error(`Error deleting session ${id}:`, error);
      return false;
    }
  }

  /**
   * Add a message to a session
   * @param sessionId Session ID
   * @param message Message to add
   * @returns Updated session or null if not found
   */
  async addMessage(sessionId: string, message: Message): Promise<ChatSession | null> {
    const session = await this.getSessionById(sessionId);
    
    if (!session) {
      return null;
    }
    
    // Add message
    session.messages.push(message);
    
    // Update timestamp
    session.updatedAt = new Date().toISOString();
    
    // Save session
    await this.saveSession(session);
    
    return session;
  }
}
