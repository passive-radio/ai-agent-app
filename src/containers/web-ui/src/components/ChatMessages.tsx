import React, { useRef, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { Message } from '../../../../common/types';
import MessageBubble from './MessageBubble';
import ThinkingIndicator from './ThinkingIndicator';

interface ChatMessagesProps {
  messages: Message[];
  thinking: string | null;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, thinking }) => {
  const scrollViewRef = useRef<ScrollView>(null);

  // Log messages whenever they change
  useEffect(() => {
    console.log('ChatMessages component received messages:', messages);
  }, [messages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, thinking]);

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Start a conversation with the AI agent.
          </Text>
          <Text style={styles.emptySubtext}>
            You can ask questions, request information, or give instructions.
          </Text>
        </View>
      ) : (
        messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))
      )}

      {thinking && <ThinkingIndicator content={thinking} />}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});

export default ChatMessages;
