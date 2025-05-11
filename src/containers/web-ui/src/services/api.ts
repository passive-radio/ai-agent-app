import axios from 'axios';

// Create axios instance with base URL
export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication if needed
api.interceptors.request.use(
  (config) => {
    // You can add auth token here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors here
    if (error.response) {
      // Server responded with an error status
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request was made but no response received
      console.error('API Error: No response received', error.request);
    } else {
      // Something else happened
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * Create an SSE connection to the server
 * @param url SSE endpoint URL
 * @param onMessage Message event handler
 * @param onThinking Thinking event handler
 * @param onError Error event handler
 * @param onDone Done event handler
 * @returns EventSource instance
 */
export function createSSEConnection(
  url: string,
  onMessage: (data: any) => void,
  onThinking: (data: any) => void,
  onError: (data: any) => void,
  onDone: () => void
): EventSource {
  console.log('Creating SSE connection to:', url);
  const eventSource = new EventSource(url, { withCredentials: true });

  // Log when the connection is established
  eventSource.onopen = () => {
    console.log('SSE connection established');
  };

  eventSource.addEventListener('message', (event) => {
    console.log('Raw SSE message event received:', event);
    try {
      const data = JSON.parse(event.data);
      console.log('Parsed SSE message data:', data);
      onMessage(data);
    } catch (error) {
      console.error('Error parsing SSE message data:', error, event.data);
    }
  });

  eventSource.addEventListener('thinking', (event) => {
    console.log('Raw SSE thinking event received:', event);
    try {
      const data = JSON.parse(event.data);
      console.log('Parsed SSE thinking data:', data);
      onThinking(data);
    } catch (error) {
      console.error('Error parsing SSE thinking data:', error, event.data);
    }
  });

  eventSource.addEventListener('error', (event) => {
    console.log('Raw SSE error event received:', event);
    try {
      const data = JSON.parse((event as any).data || '{"error": "Unknown error"}');
      console.log('Parsed SSE error data:', data);
      onError(data);
    } catch (error) {
      console.error('Error parsing SSE error data:', error, (event as any).data);
    }
  });

  eventSource.addEventListener('done', (event) => {
    console.log('Raw SSE done event received:', event);
    try {
      onDone();
    } catch (err) {
      console.error('Error in onDone handler:', err);
    }
    eventSource.close();
  });

  // Log general errors
  eventSource.onerror = (error) => {
    console.error('SSE connection error:', error);
  };

  return eventSource;
}

/**
 * Send a chat message and receive streaming response
 * @param sessionId Session ID
 * @param message User message
 * @param modelId Model ID
 * @param onMessage Message event handler
 * @param onThinking Thinking event handler
 * @param onError Error event handler
 * @param onDone Done event handler
 * @returns EventSource instance
 */
export function sendChatMessage(
  sessionId: string,
  message: string,
  modelId: string,
  onMessage: (data: any) => void,
  onThinking: (data: any) => void,
  onError: (data: any) => void,
  onDone: () => void
): EventSource {
  // Pass the user message via query parameters so that the same SSE connection
  // streams the response. This avoids creating two independent HTTP
  // connections (one GET for SSE and one POST for the payload) which was the
  // root cause of not receiving any events on the client.
  const queryParams = new URLSearchParams({
    sessionId,
    modelId,
    message,
  });

  const url = `${api.defaults.baseURL}/api/chat?${queryParams.toString()}`;

  // Open a single SSE connection that will immediately start streaming the
  // response for this message.
  return createSSEConnection(
    url,
    onMessage,
    onThinking,
    onError,
    onDone
  );
}
