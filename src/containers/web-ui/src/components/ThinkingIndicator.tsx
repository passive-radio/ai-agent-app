import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import MarkdownContent from './MarkdownContent';

interface ThinkingIndicatorProps {
  content: string;
}

const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({ content }) => {
  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <View style={styles.header}>
          <ActivityIndicator size="small" color="#0066cc" style={styles.loader} />
          <Text style={styles.title}>Thinking...</Text>
        </View>
        <MarkdownContent 
          content={content}
          isSystem={true}
        />
        <View style={styles.dotsContainer}>
          <View style={[styles.dot, styles.dot1]} />
          <View style={[styles.dot, styles.dot2]} />
          <View style={[styles.dot, styles.dot3]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    marginVertical: 8,
    maxWidth: '80%',
  },
  bubble: {
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  loader: {
    marginRight: 8,
  },
  title: {
    fontWeight: '600',
    marginBottom: 4,
    color: '#666',
  },
  content: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999',
    marginRight: 4,
    opacity: 0.6,
  },
  dot1: {
    animationName: 'bounce',
    animationDuration: '1s',
    animationIterationCount: 'infinite',
  },
  dot2: {
    animationName: 'bounce',
    animationDuration: '1s',
    animationDelay: '0.2s',
    animationIterationCount: 'infinite',
  },
  dot3: {
    animationName: 'bounce',
    animationDuration: '1s',
    animationDelay: '0.4s',
    animationIterationCount: 'infinite',
  },
});

export default ThinkingIndicator;
