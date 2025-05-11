import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSession } from '../hooks/useSession';
import { useModel } from '../hooks/useModel';
import ChatHeader from '../components/ChatHeader';
import ChatMessages from '../components/ChatMessages';
import ChatInput from '../components/ChatInput';
import SessionSidebar from '../components/SessionSidebar';
import { sendChatMessage } from '../services/api';
import { Message } from '../../../../common/types';
import { v4 as uuidv4 } from 'uuid';

const ChatScreen: React.FC = () => {
  const { currentSession } = useSession();
  const { currentModel } = useModel();
  const [thinking, setThinking] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const eventSourceRef = useRef<EventSource | null>(null);
  const [tempResponse, setTempResponse] = useState<{ content: string, messageId: string } | null>(null);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);

  // Initialize local messages from session when it changes
  useEffect(() => {
    if (currentSession?.messages) {
      console.log('Setting initial localMessages from session:', currentSession.messages);
      setLocalMessages(currentSession.messages);
    }
  }, [currentSession?.id, currentSession?.messages?.length]);

  // Clean up event source on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleSendMessage = (message: string) => {
    if (!currentSession || !currentModel || !message.trim() || isSending) {
      return;
    }

    console.log('Sending message:', message);
    console.log('Current session ID:', currentSession.id);
    console.log('Current model ID:', currentModel.id);

    setIsSending(true);
    setThinking(null);
    setTempResponse(null);

    // Add user message to local messages immediately
    const userMessageId = uuidv4();
    const userMessage = {
      id: userMessageId,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    setLocalMessages((prev: Message[]) => [...prev, userMessage]);

    // Close existing event source if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Send message and handle streaming response
    eventSourceRef.current = sendChatMessage(
      currentSession.id,
      message,
      currentModel.id,
      (data) => {
        // Handle message event
        console.log('SSE message event received:', data);
        if (data.content && data.messageId) {
          console.log('Setting tempResponse:', data);
          setTempResponse((prev: { content: string, messageId: string } | null) => {
            // For first message or new message ID
            if (!prev || prev.messageId !== data.messageId) {
              return data;
            }
            
            // For subsequent chunks with same message ID, accumulate the content
            return {
              messageId: data.messageId,
              content: (prev.content || '') + (data.content || '')
            };
          });
        }
      },
      (data) => {
        // Handle thinking event
        console.log('SSE thinking event received:', data);
        setThinking(data.content);
      },
      (data) => {
        // Handle error event
        console.error('SSE error event received:', data.error);
        setIsSending(false);
      },
      () => {
        // Handle done event
        console.log('SSE done event received');
        setThinking(null);
        setIsSending(false);
      }
    );
  };

  // Effect to update local messages with streaming response
  useEffect(() => {
    if (!tempResponse || !currentSession) return;
    
    console.log('Processing tempResponse in useEffect:', tempResponse);
    console.log('Current localMessages:', localMessages);
    
    // Create a local copy of messages
    const messages = [...localMessages];
    
    // Check if we already have this message
    const existingMsgIndex = messages.findIndex(msg => msg.id === tempResponse.messageId);
    console.log('existingMsgIndex:', existingMsgIndex);
    
    if (existingMsgIndex >= 0) {
      // Update existing message
      console.log('Updating existing message at index:', existingMsgIndex);
      messages[existingMsgIndex] = {
        ...messages[existingMsgIndex],
        content: tempResponse.content
      };
    } else {
      // Add new message
      console.log('Adding new message with ID:', tempResponse.messageId);
      messages.push({
        id: tempResponse.messageId,
        role: 'assistant',
        content: tempResponse.content,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('Updated messages array:', messages);
    // ユーザーメッセージが含まれているか確認して、ない場合は復元
    const hasUserMessage = messages.some(msg => msg.role === 'user');
    
    if (!hasUserMessage) {
      console.warn('User message is missing from messages array, restoring it...');
      // 前回のユーザーメッセージを復元
      const userMessages = localMessages.filter((msg: Message) => msg.role === 'user');
      if (userMessages.length > 0) {
        const lastUserMessage = userMessages[userMessages.length - 1];
        console.log('Restoring user message:', lastUserMessage);
        // ユーザーメッセージをリストに追加して更新
        setLocalMessages([...messages, lastUserMessage]);
      } else {
        // 念のため、標準のアップデートを実行
        setLocalMessages(messages);
      }
    } else {
      // 通常通りメッセージを更新
      setLocalMessages(messages);
    }
  }, [tempResponse, currentSession]);

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  console.log('localMessages:', localMessages);
  console.log('currentSession:', currentSession);
  console.log('tempResponse:', tempResponse);
  console.log('thinking:', thinking);

  // Use local messages for display instead of currentSession.messages
  const displayMessages = localMessages.length > 0 ? localMessages : currentSession?.messages || [];
  console.log('Final displayMessages:', displayMessages);

  return (
    <View style={styles.container}>
      {sidebarVisible && (
        <View style={styles.sidebar}>
          <SessionSidebar />
        </View>
      )}
      <View style={styles.chatContainer}>
        <ChatHeader 
          onMenuPress={toggleSidebar} 
          title={currentSession?.title || 'New Chat'} 
        />
        <ChatMessages 
          messages={displayMessages} 
          thinking={thinking}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          style={styles.inputContainer}
        >
          <ChatInput 
            onSend={handleSendMessage} 
            disabled={!currentSession || isSending} 
          />
        </KeyboardAvoidingView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 280,
    backgroundColor: '#f5f5f5',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  chatContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
});

export default ChatScreen;
