/**
 * Tool service for creating LangChain tools for the ReAct agent
 */
import { tool } from '@langchain/core/tools';
import axios from 'axios';
import { z } from 'zod';

/**
 * Create tools for the LangChain ReAct agent
 * @returns Array of tools
 */
export function createTools() {
  return [
    // Get Current Time tool
    tool(
      async ({ timezone }) => {
        try {
          console.log(`Requesting current time with timezone: ${timezone || 'UTC'}`);
          const response = await axios.get('http://time:3000/get_current_time', {
            params: { timezone: timezone || 'UTC' },
            timeout: 5000, // 5 second timeout
          });
          
          console.log('Time API response:', response.data);
          return JSON.stringify(response.data);
        } catch (error) {
          console.error('Error getting current time:', error);
          return `Error getting current time: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      },
      {
        name: 'current-time',
        description: 'Get the current time and date in a specific timezone',
        schema: z.object({
          timezone: z.string().optional().describe('The timezone to get current time in (e.g., "UTC", "America/New_York", "Asia/Tokyo"). Defaults to UTC if not specified.')
        }),
      }
    ),
    
    // Convert Time tool
    tool(
      async ({ time, from_timezone, to_timezone }) => {
        try {
          console.log(`Converting time from ${from_timezone} to ${to_timezone}`);
          const response = await axios.get('http://time:3000/convert_time', {
            params: { 
              time, 
              from_timezone, 
              to_timezone 
            },
            timeout: 5000, // 5 second timeout
          });
          
          console.log('Time conversion API response:', response.data);
          return JSON.stringify(response.data);
        } catch (error) {
          console.error('Error converting time:', error);
          return `Error converting time: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      },
      {
        name: 'convert-time',
        description: 'Convert time between different timezones',
        schema: z.object({
          time: z.string().describe('The time to convert (e.g., "2023-04-01T12:00:00")'),
          from_timezone: z.string().describe('Source timezone (e.g., "UTC", "America/New_York")'),
          to_timezone: z.string().describe('Target timezone (e.g., "Asia/Tokyo", "Europe/London")')
        }),
      }
    ),

    // Web search tool
    tool(
      async ({ query }) => {
        try {
          console.log(`Searching web for "${query}"`);
          const response = await axios.get('http://brave-search:3000/api/search', {
            params: { q: query },
            timeout: 10000, // 10 second timeout
          });
          
          console.log('Search API response:', response.data);
          return JSON.stringify(response.data);
        } catch (error) {
          console.error('Error searching the web:', error);
          return `Error searching the web: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      },
      {
        name: 'web-search',
        description: 'Search the web for information',
        schema: z.object({
          query: z.string().describe('The search query'),
        }),
      }
    ),

    // Web fetch tool
    tool(
      async ({ url: targetUrl }) => {
        try {
          console.log(`Fetching content from "${targetUrl}"`);
          const response = await axios.get('http://fetch:3000/api/fetch', {
            params: { url: targetUrl },
            timeout: 10000, // 10 second timeout
          });
          
          console.log('Fetch API response:', response.data);
          return JSON.stringify(response.data);
        } catch (error) {
          console.error('Error fetching URL:', error);
          return `Error fetching URL: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      },
      {
        name: 'web-fetch',
        description: 'Fetch content from a URL',
        schema: z.object({
          url: z.string().url().describe('The URL to fetch'),
        }),
      }
    ),

    // Calculator tool
    tool(
      async ({ expression }) => {
        try {
          // Simple and safe evaluation of mathematical expressions
          // This is a basic implementation and should be enhanced for production
          const sanitizedExpression = expression.replace(/[^0-9+\-*/().]/g, '');
          
          // Using Function constructor to evaluate the expression
          // eslint-disable-next-line no-new-func
          const result = new Function(`return ${sanitizedExpression}`)();
          return result.toString();
        } catch (error) {
          console.error('Error calculating expression:', error);
          return `Error calculating expression: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      },
      {
        name: 'calculator',
        description: 'Perform mathematical calculations',
        schema: z.object({
          expression: z.string().describe('The mathematical expression to evaluate'),
        }),
      }
    ),
  ];
}
