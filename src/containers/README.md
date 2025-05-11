## Containers of this service.

1. `web-ui`
    - React Native Web and Expo.
    - Use React Native Resuable. This is universal shadcn/ui for React Native.
    - Example installation code: `npx @react-native-reusables/cli@latest add button` when you want to use button component.
    - Dark/Light theme is automatically applied according to the system setting in React Native.

2. `server`
    - Fastify
    - Use Openrouter to call different LLMs.
    - Use langchain and langchain ReAct agent implementation.
    - Use server-sent events (SSE) to return the (final or intermediate) response of the LLM in a stream.

### Other docker containers that runs concurrently with docker-compose.yml

#### MCP servers

1. `time`
    - This is a simple container that returns the current time.
    - Docker Hub image: `mcp/time`

2. `fetch`
    - This is a simple container that fetches a web page and returns the content.
    - Docker Hub image: `mcp/fetch`

3. `brave-search`
    - This is a container that uses Brave Search to search the web. This is the default server for web searching of this service.
    - Docker Hub image: `mcp/brave-search`
