/**
 * YAML utilities for chat history import/export
 */
import yaml from 'js-yaml';
import { ChatHistoryExport, ChatSession } from '../types';

/**
 * Convert chat sessions to YAML format
 * @param sessions Array of chat sessions
 * @returns YAML string representation of chat history
 */
export function sessionsToYaml(sessions: ChatSession[]): string {
  const exportData: ChatHistoryExport = {
    version: '1.0',
    sessions,
    exportedAt: new Date().toISOString(),
  };
  
  return yaml.dump(exportData, {
    indent: 2,
    lineWidth: -1, // No line wrapping
    noRefs: true,
  });
}

/**
 * Parse YAML chat history into chat sessions
 * @param yamlContent YAML string containing chat history
 * @returns Array of chat sessions
 * @throws Error if YAML parsing fails
 */
export function yamlToSessions(yamlContent: string): ChatSession[] {
  try {
    const parsed = yaml.load(yamlContent) as ChatHistoryExport;
    
    // Validate the parsed data
    if (!parsed || !parsed.sessions || !Array.isArray(parsed.sessions)) {
      throw new Error('Invalid YAML format: missing sessions array');
    }
    
    return parsed.sessions;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse YAML: ${error.message}`);
    }
    throw new Error('Failed to parse YAML: unknown error');
  }
}
