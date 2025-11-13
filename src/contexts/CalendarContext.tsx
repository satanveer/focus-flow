import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { calendarService, type AppwriteCalendarEvent } from '../lib/appwrite';
import { calendarSyncService, type SyncResult } from '../lib/calendarSync';
import { googleCalendarService } from '../lib/googleCalendar';
import { useAuth } from './AuthContext';
import { toast } from '../components/Toast';
import type { CalendarEvent, CalendarView, TimeBlock, ProductivityGoal } from '../domain/models';

// Calendar state interface
interface CalendarState {
  // Current view settings
  view: CalendarView;
  selectedDate: Date;
  
  // Data
  events: CalendarEvent[];
  timeBlocks: TimeBlock[];
  productivityGoals: ProductivityGoal[];
  
  // Loading states
  loading: {
    events: boolean;
    timeBlocks: boolean;
    goals: boolean;
  };
  
  // UI states
  showEventModal: boolean;
  selectedEvent: CalendarEvent | null;
  draggedEvent: CalendarEvent | null;
}

// Calendar actions
type CalendarAction =
  | { type: 'SET_VIEW'; payload: CalendarView }
  | { type: 'SET_SELECTED_DATE'; payload: Date }
  | { type: 'SET_EVENTS'; payload: CalendarEvent[] }
  | { type: 'ADD_EVENT'; payload: CalendarEvent }
  | { type: 'UPDATE_EVENT'; payload: { id: string; updates: Partial<CalendarEvent> } }
  | { type: 'DELETE_EVENT'; payload: string }
  | { type: 'SET_TIME_BLOCKS'; payload: TimeBlock[] }
  | { type: 'SET_PRODUCTIVITY_GOALS'; payload: ProductivityGoal[] }
  | { type: 'SET_LOADING'; payload: { key: keyof CalendarState['loading']; value: boolean } }
  | { type: 'SHOW_EVENT_MODAL'; payload: CalendarEvent | null }
  | { type: 'HIDE_EVENT_MODAL' }
  | { type: 'SET_DRAGGED_EVENT'; payload: CalendarEvent | null };

// Initial state
const initialState: CalendarState = {
  view: { type: 'week', date: new Date().toISOString().split('T')[0] },
  selectedDate: new Date(),
  events: [],
  timeBlocks: [],
  productivityGoals: [],
  loading: {
    events: false,
    timeBlocks: false,
    goals: false,
  },
  showEventModal: false,
  selectedEvent: null,
  draggedEvent: null,
};

// Calendar reducer
function calendarReducer(state: CalendarState, action: CalendarAction): CalendarState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, view: action.payload };
    case 'SET_SELECTED_DATE':
      return { ...state, selectedDate: action.payload };
    case 'SET_EVENTS':
      return { ...state, events: action.payload };
    case 'ADD_EVENT':
      return { ...state, events: [...state.events, action.payload] };
    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map(event =>
          event.id === action.payload.id ? { ...event, ...action.payload.updates } : event
        ),
      };
    case 'DELETE_EVENT':
      return {
        ...state,
        events: state.events.filter(event => event.id !== action.payload),
      };
    case 'SET_TIME_BLOCKS':
      return { ...state, timeBlocks: action.payload };
    case 'SET_PRODUCTIVITY_GOALS':
      return { ...state, productivityGoals: action.payload };
    case 'SET_LOADING':
      return {
        ...state,
        loading: { ...state.loading, [action.payload.key]: action.payload.value },
      };
    case 'SHOW_EVENT_MODAL':
      return { ...state, showEventModal: true, selectedEvent: action.payload };
    case 'HIDE_EVENT_MODAL':
      return { ...state, showEventModal: false, selectedEvent: null };
    case 'SET_DRAGGED_EVENT':
      return { ...state, draggedEvent: action.payload };
    default:
      return state;
  }
}

// Convert Appwrite types to domain types
function convertAppwriteEvent(appwriteEvent: AppwriteCalendarEvent): CalendarEvent {
  return {
    id: appwriteEvent.$id,
    title: appwriteEvent.title,
    description: appwriteEvent.description,
    type: appwriteEvent.type,
    status: appwriteEvent.status,
    startTime: appwriteEvent.startTime,
    endTime: appwriteEvent.endTime,
    allDay: appwriteEvent.allDay,
    recurrence: appwriteEvent.recurrence,
    recurrenceEndDate: appwriteEvent.recurrenceEndDate,
    recurrenceData: {
      interval: appwriteEvent.recurrenceInterval,
      daysOfWeek: appwriteEvent.recurrenceDaysOfWeek ? JSON.parse(appwriteEvent.recurrenceDaysOfWeek) : undefined,
      dayOfMonth: appwriteEvent.recurrenceDayOfMonth,
    },
    taskId: appwriteEvent.taskId,
    pomodoroSessionId: appwriteEvent.pomodoroSessionId,
    parentEventId: appwriteEvent.parentEventId,
    focusDuration: appwriteEvent.focusDuration,
    actualFocusTime: appwriteEvent.actualFocusTime,
    productivityRating: appwriteEvent.productivityRating,
    goalMinutes: appwriteEvent.goalMinutes,
    color: appwriteEvent.color,
    location: appwriteEvent.location,
    attendees: appwriteEvent.attendees ? JSON.parse(appwriteEvent.attendees) : [],
    reminders: appwriteEvent.reminders ? JSON.parse(appwriteEvent.reminders) : [],
    tags: appwriteEvent.tags ? JSON.parse(appwriteEvent.tags) : [],
    // Google Calendar sync fields
    googleCalendarId: appwriteEvent.googleCalendarId,
    googleCalendarEtag: appwriteEvent.googleCalendarEtag,
    source: appwriteEvent.source,
    lastSyncedAt: appwriteEvent.lastSyncedAt,
    createdAt: appwriteEvent.$createdAt,
    updatedAt: appwriteEvent.$updatedAt,
  };
}

// Calendar context interface
interface CalendarContextType {
  // State
  state: CalendarState;
  
  // View actions
  setView: (view: CalendarView) => void;
  setSelectedDate: (date: Date) => void;
  navigateToToday: () => void;
  navigateNext: () => void;
  navigatePrevious: () => void;
  
  // Event actions
  createEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CalendarEvent>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<CalendarEvent>;
  deleteEvent: (id: string) => Promise<void>;
  duplicateEvent: (id: string) => Promise<CalendarEvent>;
  
  // Focus session integration
  createFocusSession: (event: CalendarEvent) => Promise<void>;
  scheduleTaskOnCalendar: (taskId: string, startTime: Date, duration?: number) => Promise<CalendarEvent>;
  
  // Time blocking
  createTimeBlock: (timeBlock: Omit<TimeBlock, 'id'>) => Promise<TimeBlock>;
  optimizeSchedule: (date: Date) => Promise<void>;
  
  // Productivity tracking
  updateGoalProgress: (minutes: number, date?: Date) => Promise<void>;
  getDailyGoal: (date: Date) => ProductivityGoal | null;
  getWeeklyStats: (date: Date) => { totalMinutes: number; goalMinutes: number; streak: number };
  
  // Google Calendar sync
  googleCalendar: {
    isConnected: boolean;
    isConnecting: boolean;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    sync: (options?: { direction?: 'pull' | 'push' | 'both'; dryRun?: boolean }) => Promise<SyncResult>;
    removeDuplicates: () => Promise<{ removed: number; errors: string[] }>;
    lastSyncTime?: Date;
    refreshConnectionState: () => Promise<void>;
  };
  
  // Sync settings
  syncSettings: {
    autoSync: boolean;
    autoLogSessions: boolean;
    syncInterval: number;
  };
  updateSyncSettings: (settings: Partial<CalendarContextType['syncSettings']>) => void;
  
  // UI actions
  showEventModal: (event?: CalendarEvent) => void;
  hideEventModal: () => void;
  
  // Data loading
  refreshData: () => Promise<void>;
  loadEventsForPeriod: (startDate: Date, endDate: Date) => Promise<void>;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};

interface CalendarProviderProps {
  children: ReactNode;
}

export const CalendarProvider: React.FC<CalendarProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(calendarReducer, initialState);
  const { user } = useAuth();
  
  // Google Calendar connection state
  const [isGoogleConnecting, setIsGoogleConnecting] = React.useState(false);
  const [googleConnected, setGoogleConnected] = React.useState(false);
  
  // Initialize Google Calendar connection state
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const isConnected = await googleCalendarService.hasValidTokens();
        setGoogleConnected(isConnected);
        
        // If connected and user is logged in, initialize auto-sync with refresh callback
        if (isConnected && user) {
          await calendarSyncService.initializeAutoSync(user.$id, async () => {
            // Refresh calendar data when sync completes
            console.log('🔄 Auto-sync completed, refreshing calendar data...');
            
            // Refresh events directly here
            try {
              dispatch({ type: 'SET_LOADING', payload: { key: 'events', value: true } });
              
              const now = new Date();
              const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
              const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();
              
              const appwriteEvents = await calendarService.getEvents(user.$id, startDate, endDate);
              const events = appwriteEvents.map(convertAppwriteEvent);
              
              dispatch({ type: 'SET_EVENTS', payload: events });
            } catch (error) {
              console.error('Failed to refresh calendar events after sync:', error);
            } finally {
              dispatch({ type: 'SET_LOADING', payload: { key: 'events', value: false } });
            }
          });
        }
      } catch (error) {
        console.error('Failed to check Google Calendar connection:', error);
        setGoogleConnected(false);
      }
    };
    
    if (user) {
      checkConnection();
      
      // Periodically check connection status (every 5 minutes)
      // This ensures we detect and handle token expiration/refresh
      const connectionCheckInterval = setInterval(() => {
        checkConnection();
      }, 5 * 60 * 1000); // 5 minutes
      
      return () => {
        clearInterval(connectionCheckInterval);
        calendarSyncService.stopAutoSync();
      };
    }
    
    // Cleanup: stop auto-sync when component unmounts
    return () => {
      calendarSyncService.stopAutoSync();
    };
  }, [user]);

  // Function to refresh Google connection state (for OAuth callback)
  const refreshGoogleConnectionState = useCallback(async () => {
    try {
      const isConnected = await googleCalendarService.hasValidTokens();
      setGoogleConnected(isConnected);
      if (isConnected) {
        calendarSyncService.updateLastSyncTime();
      }
    } catch (error) {
      console.error('Failed to refresh Google Calendar connection state:', error);
      setGoogleConnected(false);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user]);

  // Google Calendar sync methods
  const connectGoogleCalendar = useCallback(async () => {
    if (isGoogleConnecting) return;
    
    setIsGoogleConnecting(true);
    try {
      console.log('🔗 Attempting to connect Google Calendar...');
      
      const authUrl = googleCalendarService.getAuthUrl();
      console.log('✅ Auth URL generated:', authUrl);
      
      // Store the current page path to return to after auth
      localStorage.setItem('google_auth_return_path', window.location.pathname);
      
      // Redirect to Google OAuth (instead of popup)
      console.log('🚀 Redirecting to Google OAuth...');
      window.location.href = authUrl;
    } catch (error) {
      console.error('❌ Failed to connect Google Calendar:', error);
      setIsGoogleConnecting(false);
      
      // Show user-friendly error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to connect Google Calendar: ${errorMessage}. Please check your credentials.`, 7000);
      throw error;
    }
  }, [isGoogleConnecting]);

  const disconnectGoogleCalendar = useCallback(async () => {
    try {
      await googleCalendarService.clearAccessToken();
      setGoogleConnected(false);
    } catch (error) {
      console.error('Failed to disconnect Google Calendar:', error);
      // Still set to false even if clearing fails
      setGoogleConnected(false);
    }
  }, []);

  const syncGoogleCalendar = useCallback(async (options?: { direction?: 'pull' | 'push' | 'both'; dryRun?: boolean }) => {
    if (!googleConnected) {
      throw new Error('Google Calendar not connected');
    }
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const result = await calendarSyncService.sync(user.$id, options);
    
    if (result.imported > 0 || result.updated > 0) {
      // Refresh events after sync
      await refreshData();
    }
    
    calendarSyncService.updateLastSyncTime();
    return result;
  }, [googleConnected, user]);

  const removeDuplicateEvents = useCallback(async () => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const result = await calendarSyncService.removeDuplicates(user.$id);
    
    if (result.removed > 0) {
      // Refresh events after removing duplicates
      await refreshData();
    }
    
    return result;
  }, [user]);

  // Sync settings
  const syncSettings = calendarSyncService.getSyncSettings();
  
  const updateSyncSettings = useCallback((settings: Partial<typeof syncSettings>) => {
    calendarSyncService.updateSyncSettings(settings);
  }, []);

  // View navigation functions
  const setView = useCallback((view: CalendarView) => {
    dispatch({ type: 'SET_VIEW', payload: view });
  }, []);

  const setSelectedDate = useCallback((date: Date) => {
    dispatch({ type: 'SET_SELECTED_DATE', payload: date });
  }, []);

  const navigateToToday = useCallback(() => {
    const today = new Date();
    setSelectedDate(today);
    setView({ ...state.view, date: today.toISOString().split('T')[0] });
  }, [state.view]);

  const navigateNext = useCallback(() => {
    const currentDate = new Date(state.selectedDate);
    let nextDate: Date;
    
    switch (state.view.type) {
      case 'day':
        nextDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
        break;
      case 'week':
        nextDate = new Date(currentDate.setDate(currentDate.getDate() + 7));
        break;
      case 'month':
        nextDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
        break;
      default:
        nextDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
    }
    
    setSelectedDate(nextDate);
    setView({ ...state.view, date: nextDate.toISOString().split('T')[0] });
  }, [state.selectedDate, state.view]);

  const navigatePrevious = useCallback(() => {
    const currentDate = new Date(state.selectedDate);
    let prevDate: Date;
    
    switch (state.view.type) {
      case 'day':
        prevDate = new Date(currentDate.setDate(currentDate.getDate() - 1));
        break;
      case 'week':
        prevDate = new Date(currentDate.setDate(currentDate.getDate() - 7));
        break;
      case 'month':
        prevDate = new Date(currentDate.setMonth(currentDate.getMonth() - 1));
        break;
      default:
        prevDate = new Date(currentDate.setDate(currentDate.getDate() - 1));
    }
    
    setSelectedDate(prevDate);
    setView({ ...state.view, date: prevDate.toISOString().split('T')[0] });
  }, [state.selectedDate, state.view]);

  // Event CRUD operations
  // Helper functions for Google Calendar integration
  const getEventTypeEmoji = (type: string) => {
    const emojiMap: Record<string, string> = {
      'focus': '🎯',
      'break': '☕',
      'task': '✅',
      'meeting': '🤝',
      'personal': '🏠',
      'goal': '🎯'
    };
    return emojiMap[type] || '📅';
  };

  const getGoogleCalendarColorId = (type: string) => {
    const colorMap: Record<string, string> = {
      'focus': '2', // Green
      'break': '5', // Yellow
      'task': '10', // Green
      'meeting': '9', // Blue
      'personal': '4', // Red
      'goal': '1' // Blue
    };
    return colorMap[type] || '2';
  };

  const createManualEventDescription = (eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
    let description = `📅 Event Created in Focus Flow\n\n`;
    description += `📋 Type: ${eventData.type.charAt(0).toUpperCase() + eventData.type.slice(1)}\n`;
    description += `⏰ Duration: ${Math.round((new Date(eventData.endTime).getTime() - new Date(eventData.startTime).getTime()) / 1000 / 60)} minutes\n`;
    
    if (eventData.description) {
      description += `\n📝 Description:\n${eventData.description}\n`;
    }
    
    if (eventData.location) {
      description += `\n📍 Location: ${eventData.location}\n`;
    }
    
    if (eventData.tags && eventData.tags.length > 0) {
      description += `\n🏷️ Tags: ${eventData.tags.join(', ')}\n`;
    }
    
    description += `\n🚀 Created with Focus Flow`;
    description += `\n\n💡 This event helps you stay organized and track your productivity goals.`;
    
    return description;
  };

  const createEvent = useCallback(async (eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    console.log('📅 Creating event:', eventData);

    const appwriteEventData = {
      userId: user.$id,
      title: eventData.title,
      description: eventData.description,
      type: eventData.type,
      status: eventData.status,
      startTime: eventData.startTime,
      endTime: eventData.endTime,
      allDay: eventData.allDay,
      recurrence: eventData.recurrence,
      recurrenceEndDate: eventData.recurrenceEndDate,
      recurrenceInterval: eventData.recurrenceData?.interval || 1,
      recurrenceDaysOfWeek: eventData.recurrenceData?.daysOfWeek ? JSON.stringify(eventData.recurrenceData.daysOfWeek) : undefined,
      recurrenceDayOfMonth: eventData.recurrenceData?.dayOfMonth,
      taskId: eventData.taskId,
      pomodoroSessionId: eventData.pomodoroSessionId,
      parentEventId: eventData.parentEventId,
      focusDuration: eventData.focusDuration,
      actualFocusTime: eventData.actualFocusTime,
      productivityRating: eventData.productivityRating,
      goalMinutes: eventData.goalMinutes,
      color: eventData.color,
      location: eventData.location,
      attendees: JSON.stringify(eventData.attendees || []),
      reminders: JSON.stringify(eventData.reminders || []),
      tags: JSON.stringify(eventData.tags || []),
      // Mark as local event since it's created in Focus Flow
      source: 'local' as const,
    };

    console.log('📅 Appwrite event data:', appwriteEventData);

    try {
      const appwriteEvent = await calendarService.createEvent(appwriteEventData);
      console.log('✅ Event created in Appwrite:', appwriteEvent);
      
      const newEvent = convertAppwriteEvent(appwriteEvent);
      console.log('✅ Converted event:', newEvent);
      
      // Also create event in Google Calendar if authenticated
      const hasValidTokens = await googleCalendarService.hasValidTokens();
      if (hasValidTokens) {
        try {
          console.log('📅 Creating event in Google Calendar...');
          const googleEventData = googleCalendarService.createFocusSessionEvent({
            title: eventData.title,
            startTime: new Date(eventData.startTime),
            endTime: new Date(eventData.endTime),
            duration: Math.floor((new Date(eventData.endTime).getTime() - new Date(eventData.startTime).getTime()) / 1000),
            taskTitle: eventData.title,
            productivity: undefined // Manual events don't have productivity rating
          });
          
          // Override the default focus session formatting for manual events
          googleEventData.summary = `${getEventTypeEmoji(eventData.type)} ${eventData.title}`;
          googleEventData.description = createManualEventDescription(eventData);
          googleEventData.colorId = getGoogleCalendarColorId(eventData.type);
          
          const googleEvent = await googleCalendarService.createEvent(googleEventData);
          console.log('✅ Event also created in Google Calendar:', {
            id: googleEvent.id,
            summary: googleEvent.summary
          });
        } catch (googleError) {
          console.warn('⚠️ Failed to create event in Google Calendar (continuing with Appwrite-only):', googleError);
          // Don't throw the error - the event was successfully created in Appwrite
        }
      } else {
        console.log('ℹ️ Google Calendar not authenticated, event created in Appwrite only');
      }
      
      dispatch({ type: 'ADD_EVENT', payload: newEvent });
      console.log('✅ Event added to state');
      
      return newEvent;
    } catch (error) {
      console.error('❌ Failed to create event:', error);
      throw error;
    }
  }, [user]);

  const updateEvent = useCallback(async (id: string, updates: Partial<CalendarEvent>) => {
    const appwriteUpdates: any = { ...updates };
    
    // Convert arrays to JSON strings for Appwrite
    if (updates.attendees) appwriteUpdates.attendees = JSON.stringify(updates.attendees);
    if (updates.reminders) appwriteUpdates.reminders = JSON.stringify(updates.reminders);
    if (updates.tags) appwriteUpdates.tags = JSON.stringify(updates.tags);
    if (updates.recurrenceData?.daysOfWeek) {
      appwriteUpdates.recurrenceDaysOfWeek = JSON.stringify(updates.recurrenceData.daysOfWeek);
    }
    if (updates.recurrenceData?.interval) {
      appwriteUpdates.recurrenceInterval = updates.recurrenceData.interval;
    }
    if (updates.recurrenceData?.dayOfMonth) {
      appwriteUpdates.recurrenceDayOfMonth = updates.recurrenceData.dayOfMonth;
    }

    const appwriteEvent = await calendarService.updateEvent(id, appwriteUpdates);
    const updatedEvent = convertAppwriteEvent(appwriteEvent);
    
    dispatch({ type: 'UPDATE_EVENT', payload: { id, updates } });
    return updatedEvent;
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    await calendarService.deleteEvent(id);
    dispatch({ type: 'DELETE_EVENT', payload: id });
  }, []);

  const duplicateEvent = useCallback(async (id: string) => {
    const event = state.events.find(e => e.id === id);
    if (!event) throw new Error('Event not found');

    const duplicatedEvent = {
      ...event,
      title: `${event.title} (Copy)`,
      startTime: new Date(new Date(event.startTime).getTime() + 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(new Date(event.endTime).getTime() + 24 * 60 * 60 * 1000).toISOString(),
    };

    delete (duplicatedEvent as any).id;
    delete (duplicatedEvent as any).createdAt;
    delete (duplicatedEvent as any).updatedAt;

    return await createEvent(duplicatedEvent);
  }, [state.events, createEvent]);

  // Focus session integration
  const createFocusSession = useCallback(async (_event: CalendarEvent) => {
    // This would integrate with PomodoroContext to start a focus session
    // Implementation placeholder
  }, []);

  const scheduleTaskOnCalendar = useCallback(async (taskId: string, startTime: Date, duration = 1500) => {
    const endTime = new Date(startTime.getTime() + duration * 1000);
    
    const eventData = {
      title: 'Focus Session',
      type: 'focus' as const,
      status: 'scheduled' as const,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      allDay: false,
      recurrence: 'none' as const,
      taskId,
      focusDuration: duration,
      tags: ['focus', 'task'],
      reminders: [15, 5],
      attendees: [],
    };

    return await createEvent(eventData);
  }, [createEvent]);

  // UI actions
  const showEventModal = useCallback((event?: CalendarEvent) => {
    dispatch({ type: 'SHOW_EVENT_MODAL', payload: event || null });
  }, []);

  const hideEventModal = useCallback(() => {
    dispatch({ type: 'HIDE_EVENT_MODAL' });
  }, []);

  // Data loading
  const refreshData = useCallback(async () => {
    if (!user) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: { key: 'events', value: true } });
      
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();
      
      const appwriteEvents = await calendarService.getEvents(user.$id, startDate, endDate);
      const events = appwriteEvents.map(convertAppwriteEvent);
      
      dispatch({ type: 'SET_EVENTS', payload: events });
    } catch (error) {
      console.error('Failed to load calendar events:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'events', value: false } });
    }
  }, [user]);

  const loadEventsForPeriod = useCallback(async (startDate: Date, endDate: Date) => {
    if (!user) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: { key: 'events', value: true } });
      
      const appwriteEvents = await calendarService.getEvents(
        user.$id,
        startDate.toISOString(),
        endDate.toISOString()
      );
      const events = appwriteEvents.map(convertAppwriteEvent);
      
      dispatch({ type: 'SET_EVENTS', payload: events });
    } catch (error) {
      console.error('Failed to load events for period:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'events', value: false } });
    }
  }, [user]);

  // Placeholder implementations for advanced features
  const createTimeBlock = useCallback(async (timeBlock: Omit<TimeBlock, 'id'>) => {
    // Implementation would go here
    return { ...timeBlock, id: 'temp-id' };
  }, []);

  const optimizeSchedule = useCallback(async (_date: Date) => {
    // Implementation would go here
  }, []);

  const updateGoalProgress = useCallback(async (_minutes: number, _date?: Date) => {
    // Implementation would go here
  }, []);

  const getDailyGoal = useCallback((date: Date) => {
    return state.productivityGoals.find(
      goal => goal.type === 'daily' && goal.date === date.toISOString().split('T')[0]
    ) || null;
  }, [state.productivityGoals]);

  const getWeeklyStats = useCallback(() => {
    // Implementation would calculate weekly stats
    return { totalMinutes: 0, goalMinutes: 0, streak: 0 };
  }, []);

  const value: CalendarContextType = {
    state,
    setView,
    setSelectedDate,
    navigateToToday,
    navigateNext,
    navigatePrevious,
    createEvent,
    updateEvent,
    deleteEvent,
    duplicateEvent,
    createFocusSession,
    scheduleTaskOnCalendar,
    createTimeBlock,
    optimizeSchedule,
    updateGoalProgress,
    getDailyGoal,
    getWeeklyStats,
    googleCalendar: {
      isConnected: googleConnected,
      isConnecting: isGoogleConnecting,
      connect: connectGoogleCalendar,
      disconnect: disconnectGoogleCalendar,
      sync: syncGoogleCalendar,
      removeDuplicates: removeDuplicateEvents,
      lastSyncTime: syncSettings.lastSyncTime,
      refreshConnectionState: refreshGoogleConnectionState,
    },
    syncSettings,
    updateSyncSettings,
    showEventModal,
    hideEventModal,
    refreshData,
    loadEventsForPeriod,
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
};

// Legacy interface for backward compatibility
interface LegacyCalendarContextType {
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
  updateSyncSettings: (settings: Partial<LegacyCalendarContextType['syncSettings']>) => Promise<void>;
  syncTaskToCalendar: (task: any) => Promise<string | null>;
  removeTaskFromCalendar: (eventId: string) => Promise<void>;
}

// Legacy context for backward compatibility
export const useCalendarContext = (): LegacyCalendarContextType => {
  const calendar = useCalendar();
  
  return {
    connection: {
      isConnected: true,
      userEmail: 'user@example.com',
      calendarName: 'Focus Flow Calendar',
    },
    syncSettings: {
      enabled: true,
      autoSync: true,
      syncCompleted: true,
      reminderMinutes: 15,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      calendarId: 'primary',
    },
    isConnecting: false,
    isCalendarEnabled: true,
    connectCalendar: async () => console.log('Calendar connected'),
    disconnectCalendar: async () => console.log('Calendar disconnected'),
    updateSyncSettings: async () => console.log('Sync settings updated'),
    syncTaskToCalendar: async (task) => {
      if (task.dueDate) {
        const event = await calendar.scheduleTaskOnCalendar(
          task.id,
          new Date(task.dueDate),
          task.focusSeconds || 1500
        );
        return event.id;
      }
      return null;
    },
    removeTaskFromCalendar: async (eventId) => {
      await calendar.deleteEvent(eventId);
    },
  };
};
