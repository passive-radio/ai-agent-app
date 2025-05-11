import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { useModel } from '../hooks/useModel';
import { LLMModel } from '../../../../common/types';

const ModelSelector: React.FC = () => {
  const { models, currentModel, selectModel } = useModel();
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelectModel = (model: LLMModel) => {
    selectModel(model.id);
    setModalVisible(false);
  };

  const renderModelItem = ({ item }: { item: LLMModel }) => (
    <TouchableOpacity
      style={[
        styles.modelItem,
        currentModel?.id === item.id && styles.selectedModelItem,
      ]}
      onPress={() => handleSelectModel(item)}
    >
      <Text style={[
        styles.modelName,
        currentModel?.id === item.id && styles.selectedModelText,
      ]}>
        {item.name}
      </Text>
      <Text style={styles.modelProvider}>{item.provider}</Text>
      {item.description && (
        <Text style={styles.modelDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View>
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.currentModelText}>
          {currentModel?.name || 'Select Model'}
        </Text>
        <Text style={styles.dropdownIcon}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Select Model</Text>
            <FlatList
              data={models}
              renderItem={renderModelItem}
              keyExtractor={(item) => item.id}
              style={styles.modelList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  currentModelText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginRight: 4,
  },
  dropdownIcon: {
    fontSize: 10,
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
    maxHeight: '80%',
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
  modelList: {
    flex: 1,
  },
  modelItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedModelItem: {
    backgroundColor: '#f0f7ff',
  },
  modelName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  selectedModelText: {
    color: '#0066cc',
  },
  modelProvider: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  modelDescription: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },
});

export default ModelSelector;
