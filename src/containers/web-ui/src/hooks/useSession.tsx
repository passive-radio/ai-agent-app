import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ChatSession } from '../../../../common/types';
import { api } from '../services/api';

interface SessionContextType {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  loading: boolean;
  error: string | null;
  fetchSessions: () => Promise<void>;
  createSession: (title?: string, modelId?: string) => Promise<ChatSession>;
  selectSession: (sessionId: string) => Promise<void>;
  updateSession: (sessionId: string, title?: string, modelId?: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  exportHistory: () => Promise<string>;
  importHistory: (yamlContent: string) => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  // Fetch all sessions
  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/api/sessions');
      const fetchedSessions = response.data as ChatSession[];
      
      setSessions(fetchedSessions);
      
      // Set current session to the first one if none is selected
      if (fetchedSessions.length > 0 && !currentSession) {
        setCurrentSession(fetchedSessions[0]);
      }
      
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch sessions');
      setLoading(false);
      console.error('Error fetching sessions:', err);
    }
  };

  // Create a new session
  const createSession = async (title?: string, modelId?: string): Promise<ChatSession> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/api/sessions', { title, modelId });
      const newSession = response.data as ChatSession;
      
      setSessions(prev => [newSession, ...prev]);
      setCurrentSession(newSession);
      setLoading(false);
      
      return newSession;
    } catch (err) {
      setError('Failed to create session');
      setLoading(false);
      console.error('Error creating session:', err);
      throw err;
    }
  };

  // Select a session
  const selectSession = async (sessionId: string) => {
    try {
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        setCurrentSession(session);
      } else {
        // Fetch the session if not found in the current list
        const response = await api.get(`/api/sessions/${sessionId}`);
        setCurrentSession(response.data as ChatSession);
      }
    } catch (err) {
      setError('Failed to select session');
      console.error('Error selecting session:', err);
    }
  };

  // Update a session
  const updateSession = async (sessionId: string, title?: string, modelId?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.put(`/api/sessions/${sessionId}`, { title, modelId });
      const updatedSession = response.data as ChatSession;
      
      setSessions(prev => prev.map(s => s.id === sessionId ? updatedSession : s));
      
      if (currentSession?.id === sessionId) {
        setCurrentSession(updatedSession);
      }
      
      setLoading(false);
    } catch (err) {
      setError('Failed to update session');
      setLoading(false);
      console.error('Error updating session:', err);
    }
  };

  // Delete a session
  const deleteSession = async (sessionId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await api.delete(`/api/sessions/${sessionId}`);
      
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      if (currentSession?.id === sessionId) {
        const remainingSessions = sessions.filter(s => s.id !== sessionId);
        setCurrentSession(remainingSessions.length > 0 ? remainingSessions[0] : null);
      }
      
      setLoading(false);
    } catch (err) {
      setError('Failed to delete session');
      setLoading(false);
      console.error('Error deleting session:', err);
    }
  };

  // Export chat history
  const exportHistory = async (): Promise<string> => {
    try {
      const response = await api.get('/api/history/export');
      return response.data.yaml;
    } catch (err) {
      setError('Failed to export history');
      console.error('Error exporting history:', err);
      throw err;
    }
  };

  // Import chat history
  const importHistory = async (yamlContent: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await api.post('/api/history/import', { yamlContent });
      
      // Refresh sessions after import
      await fetchSessions();
      
      setLoading(false);
    } catch (err) {
      setError('Failed to import history');
      setLoading(false);
      console.error('Error importing history:', err);
    }
  };

  const value = {
    sessions,
    currentSession,
    loading,
    error,
    fetchSessions,
    createSession,
    selectSession,
    updateSession,
    deleteSession,
    exportHistory,
    importHistory,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
