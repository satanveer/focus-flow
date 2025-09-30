import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

// Minimal calendar context to prevent import errors
// This will be fully implemented later when calendar integration is added back

interface CalendarContextType {
  connection: {
    isConnected: boolean;
    userEmail?: string;
    calendarName?: string;
    error?: string;
  };
  syncSettings: {
    enabled: boolean;
    autoSync: boolean;
    syncCompleted: boolean;
    reminderMinutes: number;
    timeZone: string;
    calendarId: string;
  };
  isConnecting: boolean;
  isCalendarEnabled: boolean;
  connectCalendar: () => Promise<void>;
  disconnectCalendar: () => Promise<void>;
  updateSyncSettings: (settings: Partial<CalendarContextType['syncSettings']>) => Promise<void>;
  syncTaskToCalendar: (task: any) => Promise<string | null>;
  removeTaskFromCalendar: (eventId: string) => Promise<void>;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const useCalendarContext = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendarContext must be used within a CalendarProvider');
  }
  return context;
};

interface CalendarProviderProps {
  children: ReactNode;
}

export const CalendarProvider: React.FC<CalendarProviderProps> = ({ children }) => {
  // Default implementation that doesn't do anything
  const value: CalendarContextType = {
    connection: {
      isConnected: false,
    },
    syncSettings: {
      enabled: false,
      autoSync: false,
      syncCompleted: false,
      reminderMinutes: 15,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      calendarId: 'primary',
    },
    isConnecting: false,
    isCalendarEnabled: false,
    connectCalendar: async () => {
      console.log('Calendar integration not implemented');
    },
    disconnectCalendar: async () => {
      console.log('Calendar integration not implemented');
    },
    updateSyncSettings: async () => {
      console.log('Calendar integration not implemented');
    },
    syncTaskToCalendar: async () => {
      console.log('Calendar sync not implemented');
      return null;
    },
    removeTaskFromCalendar: async () => {
      console.log('Calendar sync not implemented');
    },
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
};
