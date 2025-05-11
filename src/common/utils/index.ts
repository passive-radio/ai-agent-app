/**
 * Common utilities for the chat application
 */

export * from './date';
export * from './yaml';

/**
 * Generate a unique ID
 * @returns Unique ID string
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Truncate a string to a maximum length
 * @param str String to truncate
 * @param maxLength Maximum length
 * @returns Truncated string
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Extract a title from a message content
 * @param content Message content
 * @param maxLength Maximum title length
 * @returns Extracted title
 */
export function extractTitleFromContent(content: string, maxLength = 30): string {
  // Remove markdown formatting
  const plainText = content.replace(/[#*_~`]/g, '');
  
  // Get the first line or sentence
  const firstLine = plainText.split('\n')[0] || '';
  const firstSentence = firstLine.split('.')[0] || '';
  
  // Use the shorter of the two
  const title = firstSentence.length < firstLine.length ? 
    firstSentence : firstLine;
  
  return truncateString(title.trim(), maxLength);
}
