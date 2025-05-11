/**
 * History controller for handling chat history import/export
 */
import { ChatHistoryExport } from '@common/types';
import { sessionsToYaml, yamlToSessions } from '@common/utils';
import { SessionService } from '../services/session.service';

export class HistoryController {
  private sessionService: SessionService;

  constructor() {
    this.sessionService = new SessionService();
  }

  /**
   * Export all chat history as YAML
   * @returns YAML string of all chat history
   */
  async exportHistory(): Promise<{ yaml: string }> {
    // Get all sessions
    const sessions = await this.sessionService.getSessions();
    
    // Convert to YAML
    const yaml = sessionsToYaml(sessions);
    
    return { yaml };
  }

  /**
   * Import chat history from YAML
   * @param yamlContent YAML content to import
   * @returns Success status and number of imported sessions
   */
  async importHistory(yamlContent: string): Promise<{ success: boolean; count: number }> {
    try {
      // Parse YAML to sessions
      const sessions = yamlToSessions(yamlContent);
      
      // Save each session
      for (const session of sessions) {
        await this.sessionService.saveSession(session);
      }
      
      return { success: true, count: sessions.length };
    } catch (error) {
      console.error('Error importing history:', error);
      throw new Error(error instanceof Error ? error.message : 'Unknown error');
    }
  }
}
