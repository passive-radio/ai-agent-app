# AI Agent Chat Service API Reference

This document provides detailed information about the API endpoints available in the AI Agent Chat Service.

## Base URL

All API endpoints are relative to the base URL:

```
http://localhost:3001
```

## Authentication

Authentication is not implemented in the MVP version, as it assumes a single user. Future versions may include authentication mechanisms.

## Response Format

Unless otherwise specified, all responses are in JSON format.

## Error Handling

Error responses follow this structure:

```json
{
  "error": true,
  "message": "Error message description",
  "statusCode": 400
}
```

## API Endpoints

### Chat

#### Stream Chat Messages

```
POST /api/chat
```

This endpoint uses Server-Sent Events (SSE) to stream responses from the AI agent.

**Query Parameters:**

| Parameter | Type   | Required | Description                      |
|-----------|--------|----------|----------------------------------|
| sessionId | string | Yes      | ID of the chat session           |
| modelId   | string | Yes      | ID of the LLM model to use       |

**Request Body:**

```json
{
  "message": "Your message to the AI agent"
}
```

**Response:**

Server-Sent Events with the following event types:

1. `thinking` - Intermediate thinking steps from the agent
   ```json
   {
     "type": "thinking",
     "content": "I need to search for information about...",
     "timestamp": "2025-05-10T11:30:45.123Z"
   }
   ```

2. `message` - Final response from the agent
   ```json
   {
     "type": "message",
     "content": "Based on my research, I found that...",
     "messageId": "msg_123456",
     "timestamp": "2025-05-10T11:31:15.456Z"
   }
   ```

3. `error` - Error message if something goes wrong
   ```json
   {
     "type": "error",
     "content": "Failed to process your request",
     "timestamp": "2025-05-10T11:30:50.789Z"
   }
   ```

4. `done` - Signal that the response is complete (no data)

**Example Usage:**

```javascript
// Client-side JavaScript
const eventSource = new EventSource('/api/chat?sessionId=sess_123&modelId=model_456');

eventSource.addEventListener('thinking', (event) => {
  const data = JSON.parse(event.data);
  console.log('Agent thinking:', data.content);
});

eventSource.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  console.log('Agent response:', data.content);
});

eventSource.addEventListener('error', (event) => {
  const data = JSON.parse(event.data);
  console.error('Error:', data.content);
});

eventSource.addEventListener('done', () => {
  eventSource.close();
  console.log('Response complete');
});

// Send the message
fetch('/api/chat?sessionId=sess_123&modelId=model_456', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ message: 'Hello, can you help me with...' }),
});
```

### Sessions

#### Get All Sessions

```
GET /api/sessions
```

Retrieves all chat sessions.

**Response:**

```json
[
  {
    "id": "sess_123",
    "title": "Research on AI",
    "messages": [
      {
        "id": "msg_456",
        "role": "user",
        "content": "Tell me about AI advancements",
        "timestamp": "2025-05-10T10:30:00.000Z"
      },
      {
        "id": "msg_457",
        "role": "assistant",
        "content": "AI has seen significant advancements in...",
        "timestamp": "2025-05-10T10:30:15.000Z"
      }
    ],
    "createdAt": "2025-05-10T10:29:50.000Z",
    "updatedAt": "2025-05-10T10:30:15.000Z",
    "modelId": "model_456"
  },
  {
    "id": "sess_124",
    "title": "Web Development Help",
    "messages": [],
    "createdAt": "2025-05-10T11:00:00.000Z",
    "updatedAt": "2025-05-10T11:00:00.000Z",
    "modelId": "model_456"
  }
]
```

#### Create a New Session

```
POST /api/sessions
```

Creates a new chat session.

**Request Body:**

```json
{
  "title": "My New Chat",
  "modelId": "model_456"
}
```

The `title` field is optional. If not provided, a default title will be generated.

**Response:**

```json
{
  "id": "sess_125",
  "title": "My New Chat",
  "messages": [],
  "createdAt": "2025-05-10T11:15:00.000Z",
  "updatedAt": "2025-05-10T11:15:00.000Z",
  "modelId": "model_456"
}
```

#### Get a Specific Session

```
GET /api/sessions/:id
```

Retrieves a specific chat session by ID.

**Path Parameters:**

| Parameter | Type   | Description        |
|-----------|--------|--------------------|
| id        | string | ID of the session  |

**Response:**

```json
{
  "id": "sess_123",
  "title": "Research on AI",
  "messages": [
    {
      "id": "msg_456",
      "role": "user",
      "content": "Tell me about AI advancements",
      "timestamp": "2025-05-10T10:30:00.000Z"
    },
    {
      "id": "msg_457",
      "role": "assistant",
      "content": "AI has seen significant advancements in...",
      "timestamp": "2025-05-10T10:30:15.000Z"
    }
  ],
  "createdAt": "2025-05-10T10:29:50.000Z",
  "updatedAt": "2025-05-10T10:30:15.000Z",
  "modelId": "model_456"
}
```

#### Update a Session

```
PUT /api/sessions/:id
```

Updates a specific chat session.

**Path Parameters:**

| Parameter | Type   | Description        |
|-----------|--------|--------------------|
| id        | string | ID of the session  |

**Request Body:**

```json
{
  "title": "Updated Chat Title",
  "modelId": "model_789"
}
```

Both fields are optional. Only the fields provided will be updated.

**Response:**

```json
{
  "id": "sess_123",
  "title": "Updated Chat Title",
  "messages": [
    {
      "id": "msg_456",
      "role": "user",
      "content": "Tell me about AI advancements",
      "timestamp": "2025-05-10T10:30:00.000Z"
    },
    {
      "id": "msg_457",
      "role": "assistant",
      "content": "AI has seen significant advancements in...",
      "timestamp": "2025-05-10T10:30:15.000Z"
    }
  ],
  "createdAt": "2025-05-10T10:29:50.000Z",
  "updatedAt": "2025-05-10T11:20:00.000Z",
  "modelId": "model_789"
}
```

#### Delete a Session

```
DELETE /api/sessions/:id
```

Deletes a specific chat session.

**Path Parameters:**

| Parameter | Type   | Description        |
|-----------|--------|--------------------|
| id        | string | ID of the session  |

**Response:**

```json
{
  "success": true
}
```

### Models

#### Get All Models

```
GET /api/models
```

Retrieves all available LLM models.

**Response:**

```json
[
  {
    "id": "model_456",
    "name": "GPT-4.1",
    "provider": "OpenAI",
    "description": "OpenAIの高性能モデル。複雑な理解と会話に優れる"
  },
  {
    "id": "model_789",
    "name": "GPT-o3-mini-high",
    "provider": "OpenAI",
    "description": "OpenAIの高性能モデル。複雑な理解と会話に優れる"
  },
  {
    "id": "model_101",
    "name": "Claude 3.7 Sonnet",
    "provider": "Anthropic",
    "description": "Anthropicの高性能モデル。特にコーディングに優れる"
  }
]
```

#### Get a Specific Model

```
GET /api/models/:id
```

Retrieves a specific LLM model by ID.

**Path Parameters:**

| Parameter | Type   | Description        |
|-----------|--------|--------------------|
| id        | string | ID of the model    |

**Response:**

```json
{
  "id": "model_456",
  "name": "GPT-4.1",
  "provider": "OpenAI",
  "description": "OpenAIの高性能モデル。複雑な理解と会話に優れる"
}
```

### History

#### Export Chat History

```
GET /api/history/export
```

Exports all chat sessions as YAML.

**Response:**

```json
{
  "yaml": "version: '1.0'\nexportedAt: '2025-05-10T11:30:00.000Z'\nsessions:\n  - id: sess_123\n    title: 'Research on AI'\n    messages:\n      - id: msg_456\n        role: user\n        content: 'Tell me about AI advancements'\n        timestamp: '2025-05-10T10:30:00.000Z'\n      - id: msg_457\n        role: assistant\n        content: 'AI has seen significant advancements in...'\n        timestamp: '2025-05-10T10:30:15.000Z'\n    createdAt: '2025-05-10T10:29:50.000Z'\n    updatedAt: '2025-05-10T10:30:15.000Z'\n    modelId: model_456\n  - id: sess_124\n    title: 'Web Development Help'\n    messages: []\n    createdAt: '2025-05-10T11:00:00.000Z'\n    updatedAt: '2025-05-10T11:00:00.000Z'\n    modelId: model_456"
}
```

#### Import Chat History

```
POST /api/history/import
```

Imports chat sessions from YAML.

**Request Body:**

```json
{
  "yamlContent": "version: '1.0'\nexportedAt: '2025-05-10T11:30:00.000Z'\nsessions:\n  - id: sess_123\n    title: 'Research on AI'\n    messages:\n      - id: msg_456\n        role: user\n        content: 'Tell me about AI advancements'\n        timestamp: '2025-05-10T10:30:00.000Z'\n      - id: msg_457\n        role: assistant\n        content: 'AI has seen significant advancements in...'\n        timestamp: '2025-05-10T10:30:15.000Z'\n    createdAt: '2025-05-10T10:29:50.000Z'\n    updatedAt: '2025-05-10T10:30:15.000Z'\n    modelId: model_456"
}
```

**Response:**

```json
{
  "success": true,
  "importedSessions": 1
}
```

## Tool Services

The following tool services are available to the ReAct agent but are not directly accessible via the API:

### Time Service

Provides current time and date information.

**Endpoint:** `http://time:3000/api/time`

### Brave Search Service

Searches the web using Brave Search.

**Endpoint:** `http://brave-search:3000/api/search`

**Query Parameters:**

| Parameter | Type   | Description        |
|-----------|--------|--------------------|
| q         | string | Search query       |

### Fetch Service

Fetches content from URLs.

**Endpoint:** `http://fetch:3000/api/fetch`

**Query Parameters:**

| Parameter | Type   | Description        |
|-----------|--------|--------------------|
| url       | string | URL to fetch       |

## WebSocket Events

The application does not use WebSockets. Instead, it uses Server-Sent Events (SSE) for real-time communication, as described in the Chat API section.

## Rate Limiting

Rate limiting is not implemented in the MVP version. Future versions may include rate limiting to prevent abuse.

## Versioning

The API does not currently use versioning. Future updates may introduce versioned endpoints (e.g., `/api/v1/chat`).

---

This API reference provides a comprehensive overview of the endpoints available in the AI Agent Chat Service. For more information, refer to the code documentation and comments in the source files.
