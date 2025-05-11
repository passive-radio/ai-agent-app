/**
 * Format a timestamp to a human-readable format
 * @param timestamp ISO timestamp string
 * @returns Formatted timestamp
 */
export function formatTimestamp(timestamp: string): string {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return '';
  }
  
  // Get today's date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get yesterday's date
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Format the time
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
  };
  const timeString = date.toLocaleTimeString(undefined, timeOptions);
  
  // Check if the date is today
  if (date >= today) {
    return `Today, ${timeString}`;
  }
  
  // Check if the date is yesterday
  if (date >= yesterday) {
    return `Yesterday, ${timeString}`;
  }
  
  // Format the date for older messages
  const dateOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
  };
  
  // Add year if it's not the current year
  if (date.getFullYear() !== today.getFullYear()) {
    dateOptions.year = 'numeric';
  }
  
  const dateString = date.toLocaleDateString(undefined, dateOptions);
  return `${dateString}, ${timeString}`;
}

/**
 * Format a number to a human-readable format
 * @param num Number to format
 * @returns Formatted number
 */
export function formatNumber(num: number): string {
  if (num === undefined || num === null) return '';
  
  return new Intl.NumberFormat().format(num);
}

/**
 * Truncate a string to a maximum length
 * @param str String to truncate
 * @param maxLength Maximum length
 * @returns Truncated string
 */
export function truncateString(str: string, maxLength: number): string {
  if (!str) return '';
  
  if (str.length <= maxLength) {
    return str;
  }
  
  return `${str.substring(0, maxLength)}...`;
}

/**
 * Extract a title from a message content
 * @param content Message content
 * @param maxLength Maximum length
 * @returns Extracted title
 */
export function extractTitle(content: string, maxLength: number = 30): string {
  if (!content) return 'New Chat';
  
  // Get the first line
  const firstLine = content.split('\n')[0].trim();
  
  // Remove markdown formatting
  const cleanLine = firstLine
    .replace(/^#+\s+/, '') // Remove heading markers
    .replace(/\*\*/g, '')  // Remove bold markers
    .replace(/\*/g, '')    // Remove italic markers
    .replace(/`/g, '')     // Remove code markers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Replace links with just the text
  
  return truncateString(cleanLine, maxLength);
}
