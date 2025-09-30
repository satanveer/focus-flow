import React, { createContext, useContext } from 'react';
import { useAppwriteTasks } from './useAppwriteTasks';

// Shape is inferred from hook return
export type AppwriteTasksContextValue = ReturnType<typeof useAppwriteTasks>;

const AppwriteTasksContext = createContext<AppwriteTasksContextValue | null>(null);

export const AppwriteTasksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useAppwriteTasks();
  return <AppwriteTasksContext.Provider value={value}>{children}</AppwriteTasksContext.Provider>;
};

export function useAppwriteTasksContext(): AppwriteTasksContextValue {
  const ctx = useContext(AppwriteTasksContext);
  if (!ctx) throw new Error('useAppwriteTasksContext must be used inside <AppwriteTasksProvider>');
  return ctx;
}

export default AppwriteTasksProvider;