import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { databases } from '../../lib/appwrite';
import { APPWRITE_CONFIG } from '../../lib/appwrite';
import { Query } from 'appwrite';
import { useAuth } from '../../contexts/AuthContext';
import type { PomodoroSession, ID, ProductivityRating } from '../../domain/models';

interface AppwritePomodoroSession {
  $id: string;
  userId: string;
  sessionId: string;
  mode: 'focus' | 'shortBreak' | 'longBreak';
  startedAt: string;
  endedAt?: string;
  durationSec: number;
  taskId?: string;
  productivityRating?: ProductivityRating;
  $createdAt: string;
  $updatedAt: string;
}

interface AppwritePomodoroContextValue {
  sessions: PomodoroSession[];
  loading: boolean;
  createSession: (session: PomodoroSession) => Promise<void>;
  updateSession: (sessionId: ID, updates: Partial<PomodoroSession>) => Promise<void>;
  deleteSession: (sessionId: ID) => Promise<void>;
  refreshSessions: () => Promise<void>;
}

const AppwritePomodoroContext = createContext<AppwritePomodoroContextValue | null>(null);

export const AppwritePomodoroProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Convert Appwrite document to domain model
  const convertToSession = useCallback((doc: AppwritePomodoroSession): PomodoroSession => {
    return {
      id: doc.sessionId,
      mode: doc.mode,
      startedAt: doc.startedAt,
      endedAt: doc.endedAt,
      durationSec: doc.durationSec,
      taskId: doc.taskId,
      productivityRating: doc.productivityRating,
    };
  }, []);

  // Load sessions from Appwrite
  const loadSessions = useCallback(async () => {
    if (!user) {
      setSessions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.pomodoroSessions,
        [
          Query.equal('userId', user.$id),
          Query.orderDesc('startedAt'),
          Query.limit(1000) // Get last 1000 sessions
        ]
      );

      const domainSessions = response.documents.map(doc => 
        convertToSession(doc as unknown as AppwritePomodoroSession)
      );

      setSessions(domainSessions);
    } catch (error) {
      console.error('Failed to load pomodoro sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [user, convertToSession]);

  // Load sessions when user changes
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Create a new session
  const createSession = useCallback(async (session: PomodoroSession) => {
    if (!user) {
      console.error('Cannot create session: user not authenticated');
      return;
    }

    try {
      const appwriteData = {
        userId: user.$id,
        sessionId: session.id,
        mode: session.mode,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        durationSec: session.durationSec,
        taskId: session.taskId,
        productivityRating: session.productivityRating,
      };

      await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.pomodoroSessions,
        'unique()',
        appwriteData
      );

      // Optimistically update local state
      setSessions(prev => [session, ...prev]);
    } catch (error) {
      console.error('Failed to create pomodoro session:', error);
      throw error;
    }
  }, [user]);

  // Update an existing session
  const updateSession = useCallback(async (sessionId: ID, updates: Partial<PomodoroSession>) => {
    if (!user) {
      console.error('Cannot update session: user not authenticated');
      return;
    }

    try {
      // Find the Appwrite document ID
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.pomodoroSessions,
        [
          Query.equal('userId', user.$id),
          Query.equal('sessionId', sessionId),
          Query.limit(1)
        ]
      );

      if (response.documents.length === 0) {
        console.error('Session not found:', sessionId);
        return;
      }

      const docId = response.documents[0].$id;

      // Prepare update data (only include fields that exist in Appwrite schema)
      const updateData: any = {};
      if (updates.endedAt !== undefined) updateData.endedAt = updates.endedAt;
      if (updates.durationSec !== undefined) updateData.durationSec = updates.durationSec;
      if (updates.productivityRating !== undefined) updateData.productivityRating = updates.productivityRating;
      if (updates.taskId !== undefined) updateData.taskId = updates.taskId;

      await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.pomodoroSessions,
        docId,
        updateData
      );

      // Optimistically update local state
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, ...updates } : s
      ));
    } catch (error) {
      console.error('Failed to update pomodoro session:', error);
      throw error;
    }
  }, [user]);

  // Delete a session
  const deleteSession = useCallback(async (sessionId: ID) => {
    if (!user) {
      console.error('Cannot delete session: user not authenticated');
      return;
    }

    try {
      // Find the Appwrite document ID
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.pomodoroSessions,
        [
          Query.equal('userId', user.$id),
          Query.equal('sessionId', sessionId),
          Query.limit(1)
        ]
      );

      if (response.documents.length === 0) {
        console.error('Session not found:', sessionId);
        return;
      }

      const docId = response.documents[0].$id;

      await databases.deleteDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.pomodoroSessions,
        docId
      );

      // Optimistically update local state
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (error) {
      console.error('Failed to delete pomodoro session:', error);
      throw error;
    }
  }, [user]);

  const value: AppwritePomodoroContextValue = {
    sessions,
    loading,
    createSession,
    updateSession,
    deleteSession,
    refreshSessions: loadSessions,
  };

  return (
    <AppwritePomodoroContext.Provider value={value}>
      {children}
    </AppwritePomodoroContext.Provider>
  );
};

export const useAppwritePomodoro = () => {
  const context = useContext(AppwritePomodoroContext);
  if (!context) {
    throw new Error('useAppwritePomodoro must be used within AppwritePomodoroProvider');
  }
  return context;
};
