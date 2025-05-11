import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Modal } from 'react-native';
import { useSession } from '../hooks/useSession';
import { useModel } from '../hooks/useModel';
import { ChatSession } from '../../../../common/types';

const SessionSidebar: React.FC = () => {
  const { 
    sessions, 
    currentSession, 
    createSession, 
    selectSession, 
    deleteSession,
    exportHistory,
    importHistory
  } = useSession();
  const { models, currentModel, selectModel } = useModel();
  
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importYaml, setImportYaml] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateSession = async () => {
    try {
      await createSession(
        newSessionTitle || undefined, 
        currentModel?.id
      );
      setNewSessionTitle('');
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const handleSelectSession = async (sessionId: string) => {
    try {
      await selectSession(sessionId);
    } catch (error) {
      console.error('Error selecting session:', error);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const handleExportHistory = async () => {
    try {
      const yaml = await exportHistory();
      // In a real app, you would save this to a file or copy to clipboard
      console.log('Exported YAML:', yaml);
      alert('History exported successfully!');
    } catch (error) {
      console.error('Error exporting history:', error);
    }
  };

  const handleImportHistory = async () => {
    try {
      await importHistory(importYaml);
      setImportYaml('');
      setImportModalVisible(false);
      alert('History imported successfully!');
    } catch (error) {
      console.error('Error importing history:', error);
    }
  };

  const renderSessionItem = ({ item }: { item: ChatSession }) => (
    <TouchableOpacity
      style={[
        styles.sessionItem,
        currentSession?.id === item.id && styles.selectedSessionItem,
      ]}
      onPress={() => handleSelectSession(item.id)}
    >
      <Text 
        style={[
          styles.sessionTitle,
          currentSession?.id === item.id && styles.selectedSessionTitle,
        ]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {item.title}
      </Text>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteSession(item.id)}
      >
        <Text style={styles.deleteButtonText}>×</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Agent Chat</Text>
      </View>

      <TouchableOpacity
        style={styles.newChatButton}
        onPress={() => setIsCreating(true)}
      >
        <Text style={styles.newChatButtonText}>+ New Chat</Text>
      </TouchableOpacity>

      {isCreating && (
        <View style={styles.createSessionContainer}>
          <TextInput
            style={styles.input}
            value={newSessionTitle}
            onChangeText={setNewSessionTitle}
            placeholder="Chat title (optional)"
            placeholderTextColor="#999"
          />
          <View style={styles.createButtonsContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsCreating(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateSession}
            >
              <Text style={styles.createButtonText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={sessions}
        renderItem={renderSessionItem}
        keyExtractor={(item) => item.id}
        style={styles.sessionList}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerButton}
          onPress={handleExportHistory}
        >
          <Text style={styles.footerButtonText}>Export</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => setImportModalVisible(true)}
        >
          <Text style={styles.footerButtonText}>Import</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={importModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImportModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setImportModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Import Chat History</Text>
            <TextInput
              style={styles.yamlInput}
              value={importYaml}
              onChangeText={setImportYaml}
              placeholder="Paste YAML content here"
              placeholderTextColor="#999"
              multiline
            />
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setImportModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.importButton}
                onPress={handleImportHistory}
                disabled={!importYaml.trim()}
              >
                <Text style={styles.importButtonText}>Import</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  newChatButton: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#0066cc',
    borderRadius: 8,
    alignItems: 'center',
  },
  newChatButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  createSessionContainer: {
    margin: 16,
    marginTop: 0,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
  },
  createButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: 8,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
  },
  createButton: {
    backgroundColor: '#0066cc',
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  createButtonText: {
    color: '#fff',
  },
  sessionList: {
    flex: 1,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectedSessionItem: {
    backgroundColor: '#e6f0ff',
  },
  sessionTitle: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  selectedSessionTitle: {
    fontWeight: '600',
    color: '#0066cc',
  },
  deleteButton: {
    padding: 4,
  },
  deleteButtonText: {
    fontSize: 18,
    color: '#999',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerButton: {
    padding: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  footerButtonText: {
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  yamlInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    height: 200,
    textAlignVertical: 'top',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  importButton: {
    backgroundColor: '#0066cc',
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  importButtonText: {
    color: '#fff',
  },
});

export default SessionSidebar;
