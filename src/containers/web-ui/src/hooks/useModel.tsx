import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LLMModel } from '../../../../common/types';
import { api } from '../services/api';

interface ModelContextType {
  models: LLMModel[];
  currentModel: LLMModel | null;
  loading: boolean;
  error: string | null;
  fetchModels: () => Promise<void>;
  selectModel: (modelId: string) => Promise<void>;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export const ModelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [models, setModels] = useState<LLMModel[]>([]);
  const [currentModel, setCurrentModel] = useState<LLMModel | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch models on mount
  useEffect(() => {
    fetchModels();
  }, []);

  // Fetch all models
  const fetchModels = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/api/models');
      const fetchedModels = response.data as LLMModel[];
      
      setModels(fetchedModels);
      
      // Set current model to the first one if none is selected
      if (fetchedModels.length > 0 && !currentModel) {
        setCurrentModel(fetchedModels[0]);
      }
      
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch models');
      setLoading(false);
      console.error('Error fetching models:', err);
    }
  };

  // Select a model
  const selectModel = async (modelId: string) => {
    try {
      const model = models.find(m => m.id === modelId);
      if (model) {
        setCurrentModel(model);
      } else {
        // Fetch the model if not found in the current list
        const response = await api.get(`/api/models/${modelId}`);
        setCurrentModel(response.data as LLMModel);
      }
    } catch (err) {
      setError('Failed to select model');
      console.error('Error selecting model:', err);
    }
  };

  const value = {
    models,
    currentModel,
    loading,
    error,
    fetchModels,
    selectModel,
  };

  return <ModelContext.Provider value={value}>{children}</ModelContext.Provider>;
};

export const useModel = (): ModelContextType => {
  const context = useContext(ModelContext);
  if (context === undefined) {
    throw new Error('useModel must be used within a ModelProvider');
  }
  return context;
};
