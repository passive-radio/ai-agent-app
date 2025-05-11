# AI Agent Chat Service User Guide

Welcome to the AI Agent Chat Service! This guide will help you get started with using the application and make the most of its features.

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [User Interface](#user-interface)
4. [Chat Sessions](#chat-sessions)
5. [Interacting with the AI Agent](#interacting-with-the-ai-agent)
6. [Switching Models](#switching-models)
7. [Managing Chat History](#managing-chat-history)
8. [Tips and Best Practices](#tips-and-best-practices)
9. [Troubleshooting](#troubleshooting)

## Introduction

The AI Agent Chat Service is a powerful application that allows you to interact with AI agents powered by LangChain's ReAct framework. These agents can perform various tasks, search the web, fetch information, and more, all while showing you their thinking process in real-time.

## Getting Started

### Accessing the Application

1. Open your web browser and navigate to the application URL (typically http://localhost:3000 if running locally).
2. The application will load and automatically create a new chat session if none exists.

## User Interface

The application has a clean, intuitive interface with the following components:

![UI Overview](ui-overview.png)

1. **Session Sidebar**: Located on the left side, this panel shows all your chat sessions and allows you to create new ones.
2. **Chat Header**: At the top of the main area, displaying the current session title and model selection.
3. **Chat Messages**: The main area where messages between you and the AI agent are displayed.
4. **Chat Input**: At the bottom, where you type your messages to the AI agent.
5. **Model Selector**: In the top-right corner, allowing you to switch between different AI models.

## Chat Sessions

### Creating a New Session

1. Click the "+" button in the Session Sidebar.
2. Enter a title for your new session (optional).
3. Select a model for the session.
4. Click "Create" to start the new session.

### Switching Between Sessions

1. Click on any session in the Session Sidebar to switch to it.
2. Your current conversation will be saved automatically.

### Renaming a Session

1. Hover over a session in the Session Sidebar.
2. Click the "Edit" icon (pencil).
3. Enter a new title.
4. Click "Save" to update the session title.

### Deleting a Session

1. Hover over a session in the Session Sidebar.
2. Click the "Delete" icon (trash).
3. Confirm the deletion when prompted.

## Interacting with the AI Agent

### Sending Messages

1. Type your message in the Chat Input area at the bottom of the screen.
2. Press Enter or click the Send button to send your message.

### Viewing Agent Thinking

When the AI agent is processing your request, you'll see:

1. A "Thinking..." indicator showing the agent's reasoning process.
2. This provides transparency into how the agent is approaching your request.
3. You can see when the agent is using tools like web search or calculations.

### Complex Tasks

The AI agent can handle complex tasks that require multiple steps:

1. Ask the agent to perform a task, such as "Find the latest news about AI and summarize the top 3 stories."
2. The agent will break this down into steps (searching the web, reading articles, summarizing).
3. You'll see the agent's thinking process for each step.
4. Finally, the agent will provide the complete response.

## Switching Models

### Selecting a Different Model

1. Click on the Model Selector in the top-right corner.
2. A dropdown menu will appear with available models.
3. Select the model you want to use.
4. The new model will be used for all subsequent messages in the current session.

### Model Capabilities

Different models have different capabilities:

- Some models are better at creative tasks.
- Some models are better at factual responses.
- Some models are faster but less comprehensive.
- Some models are more thorough but slower.

Experiment with different models to find the one that best suits your needs.

## Managing Chat History

### Exporting Chat History

1. Click on the menu icon in the Chat Header.
2. Select "Export History" from the dropdown menu.
3. The chat history will be downloaded as a YAML file.

### Importing Chat History

1. Click on the menu icon in the Chat Header.
2. Select "Import History" from the dropdown menu.
3. Select the YAML file containing the chat history.
4. The imported sessions will appear in your Session Sidebar.

## Tips and Best Practices

### Effective Prompting

To get the best results from the AI agent:

1. **Be specific**: Clearly state what you want the agent to do.
2. **Provide context**: Give relevant background information.
3. **Break down complex requests**: For very complex tasks, consider breaking them into smaller steps.

### Using Agent Tools

The AI agent has access to several tools:

1. **Web Search**: The agent can search the web for information.
   - Example: "What are the latest developments in quantum computing?"

2. **Web Content Fetching**: The agent can fetch and read content from URLs.
   - Example: "Summarize the content at https://example.com/article"

3. **Time and Date**: The agent can provide current time and date information.
   - Example: "What time is it now in Tokyo?"

4. **Calculator**: The agent can perform mathematical calculations.
   - Example: "Calculate the compound interest on $1000 at 5% for 3 years."

### Session Management

For optimal organization:

1. Create separate sessions for different topics or projects.
2. Give descriptive names to your sessions.
3. Delete old or unused sessions to keep your sidebar clean.

## Troubleshooting

### Common Issues

#### Messages Not Sending

1. Check your internet connection.
2. Refresh the page and try again.
3. Ensure the server is running (if self-hosted).

#### Agent Responses Taking Too Long

1. Try switching to a faster model.
2. Break down your request into smaller, more manageable parts.
3. Check if the server is experiencing high load (if self-hosted).

#### Incorrect or Unexpected Responses

1. Try rephrasing your request to be more specific.
2. Switch to a different model that might be better suited for your task.
3. Provide more context in your message.

### Getting Help

If you encounter issues not covered in this guide:

1. Check the [GitHub repository](https://github.com/yourusername/ai-agent-chat) for known issues.
2. Submit a new issue on GitHub with details about the problem.
3. Contact the administrator of your instance (if using a hosted version).

---

We hope this guide helps you make the most of the AI Agent Chat Service. Happy chatting!
