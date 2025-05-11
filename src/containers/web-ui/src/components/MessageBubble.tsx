import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Message } from '../../../../common/types';
import { formatTimestamp } from '../utils/formatters';
import MarkdownContent from './MarkdownContent';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  // Log when a message bubble is rendered
  useEffect(() => {
    console.log('MessageBubble rendering message:', message);
  }, [message]);

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
        isSystem && styles.systemContainer,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.assistantBubble,
          isSystem && styles.systemBubble,
        ]}
      >
        <MarkdownContent 
          content={message.content}
          isUser={isUser}
          isSystem={isSystem}
        />
      </View>
      <Text style={styles.timestamp}>{formatTimestamp(message.timestamp)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    maxWidth: '80%',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  assistantContainer: {
    alignSelf: 'flex-start',
  },
  systemContainer: {
    alignSelf: 'center',
    maxWidth: '90%',
  },
  bubble: {
    padding: 12,
    borderRadius: 18,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  userBubble: {
    backgroundColor: '#0066cc',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#e9e9eb',
    borderBottomLeftRadius: 4,
  },
  systemBubble: {
    backgroundColor: '#f0f7ff',
    borderRadius: 12,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  assistantText: {
    color: '#000',
  },
  systemText: {
    color: '#0066cc',
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
});

export default MessageBubble;
