import { Client, Account, Databases, Query, Permission, Role, ID } from 'appwrite';
// import type { Models } from 'appwrite'; // Unused import

// Appwrite configuration
export const APPWRITE_CONFIG = {
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID || '',
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || '',
  // Collection IDs
  collections: {
    tasks: import.meta.env.VITE_APPWRITE_TASKS_COLLECTION_ID || '',
    pomodoroSessions: import.meta.env.VITE_APPWRITE_POMODORO_COLLECTION_ID || '',
    notes: import.meta.env.VITE_APPWRITE_NOTES_COLLECTION_ID || '',
    folders: import.meta.env.VITE_APPWRITE_FOLDERS_COLLECTION_ID || '',
    userSettings: import.meta.env.VITE_APPWRITE_SETTINGS_COLLECTION_ID || '',
    calendarEvents: import.meta.env.VITE_APPWRITE_CALENDAR_EVENTS_COLLECTION_ID || '',
    timeBlocks: import.meta.env.VITE_APPWRITE_TIME_BLOCKS_COLLECTION_ID || '',
    productivityGoals: import.meta.env.VITE_APPWRITE_PRODUCTIVITY_GOALS_COLLECTION_ID || '',
  }
};

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(APPWRITE_CONFIG.endpoint)
  .setProject(APPWRITE_CONFIG.projectId);

// Initialize services
export const account = new Account(client);
export const databases = new Databases(client);

// Helper to get user-specific permissions
export const getUserPermissions = (userId: string) => [
  Permission.read(Role.user(userId)),
  Permission.write(Role.user(userId)),
  Permission.update(Role.user(userId)),
  Permission.delete(Role.user(userId)),
];

// Type definitions matching your current models
export interface AppwriteTask extends Document {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  dueDate: string | null;
  completed: boolean;
  focusSeconds: number;
  userId: string;
  calendarEventId?: string;
}

export interface AppwritePomodoroSession {
  $id: string;
  mode: 'focus' | 'shortBreak' | 'longBreak';
  durationSec: number;
  startedAt: string;
  endedAt?: string;
  aborted?: boolean;
  taskId?: string;
  userId: string;
  $createdAt: string;
}

export interface AppwriteNote {
  $id: string;
  title: string;
  body: string;
  folderId?: string;
  taskId?: string;
  userId: string;
  $createdAt: string;
  $updatedAt: string;
}

export interface AppwriteFolder {
  $id: string;
  name: string;
  parentId?: string;
  userId: string;
  $createdAt: string;
}

export interface AppwriteUserSettings {
  $id: string;
  theme: 'light' | 'dark' | 'system';
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  autoStartNext: boolean;
  goalMinutes: number;
  longBreakEvery: number;
  enableSound: boolean;
  enableNotifications: boolean;
  showTimerInTab: boolean;
  // Calendar settings
  calendarDefaultView: 'month' | 'week' | 'day' | 'agenda';
  calendarWeekStartsOnMonday: boolean;
  calendarShowWeekends: boolean;
  calendarDefaultFocusDuration: number;
  calendarAutoScheduleTasks: boolean;
  calendarReminderMinutes: number[];
  calendarTimeZone: string;
  userId: string;
  $updatedAt: string;
}

export interface AppwriteCalendarEvent {
  $id: string;
  title: string;
  description?: string;
  type: 'focus' | 'break' | 'task' | 'meeting' | 'personal' | 'goal';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'missed';
  
  // Timing
  startTime: string;
  endTime: string;
  allDay: boolean;
  
  // Recurrence
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';
  recurrenceEndDate?: string;
  recurrenceInterval: number;
  recurrenceDaysOfWeek?: string;  // JSON string of number[]
  recurrenceDayOfMonth?: number;
  
  // Relationships
  taskId?: string;
  pomodoroSessionId?: string;
  parentEventId?: string;
  
  // Focus-specific fields
  focusDuration?: number;
  actualFocusTime?: number;
  productivityRating?: 'great' | 'some-distractions' | 'unfocused';
  goalMinutes?: number;
  
  // Metadata
  color?: string;
  location?: string;
  attendees: string;    // JSON string of string[]
  reminders: string;    // JSON string of number[]
  tags: string;         // JSON string of string[]
  
  userId: string;
  $createdAt: string;
  $updatedAt: string;
}

export interface AppwriteTimeBlock {
  $id: string;
  title: string;
  startTime: string;
  endTime: string;
  type: 'focus' | 'break' | 'buffer';
  taskIds: string;      // JSON string of string[]
  color?: string;
  flexible: boolean;
  userId: string;
  $createdAt: string;
  $updatedAt: string;
}

export interface AppwriteProductivityGoal {
  $id: string;
  type: 'daily' | 'weekly' | 'monthly';
  targetMinutes: number;
  currentMinutes: number;
  date: string;
  achieved: boolean;
  userId: string;
  $createdAt: string;
  $updatedAt: string;
}

// Auth service
export class AuthService {
  async register(email: string, password: string, name: string) {
    try {
      const user = await account.create(ID.unique(), email, password, name);
      
      // Create default user settings
      await this.createDefaultUserSettings(user.$id);
      
      // Create email session
      await account.createEmailPasswordSession(email, password);
      
      return user;
    } catch (error) {
      throw error;
    }
  }

  async login(email: string, password: string) {
    try {
      return await account.createEmailPasswordSession(email, password);
    } catch (error) {
      throw error;
    }
  }

  async loginWithGoogle() {
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const failureUrl = `${window.location.origin}/login?error=oauth_failed`;
      
      // Mark OAuth flow as started
      localStorage.setItem('oauth_flow_started', 'true');
      
      await account.createOAuth2Session('google' as any, redirectUrl, failureUrl);
    } catch (error) {
      localStorage.removeItem('oauth_flow_started');
      throw error;
    }
  }

  async handleOAuthCallback() {
    try {
      // Get the current user after OAuth callback
      const user = await this.getCurrentUser();
      
      if (user) {
        // Check if user settings exist
        const settings = await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.userSettings,
          [Query.equal('userId', user.$id)]
        );
        
        // Create default settings if they don't exist (new OAuth user)
        if (settings.documents.length === 0) {
          await this.createDefaultUserSettings(user.$id);
        }
      }
      
      return user;
    } catch (error) {
      throw error;
    }
  }

  async handleOAuthTokenCallback(userId: string, secret: string) {
    try {
      console.log('🔍 Creating session from OAuth token...', { userId: userId.substring(0, 8) + '...', secret: secret.substring(0, 8) + '...' });
      
      // Create a session using the OAuth2 token
      await account.createSession(userId, secret);
      console.log('🔍 Session created successfully from OAuth token');
      
      // Get the current user
      const user = await this.getCurrentUser();
      console.log('🔍 User retrieved after token session creation:', user ? user.email : 'null');
      
      if (user) {
        // Check if user settings exist and create default settings if needed
        const settings = await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.userSettings,
          [Query.equal('userId', user.$id)]
        );
        
        if (settings.documents.length === 0) {
          console.log('🔍 Creating default settings for new OAuth user');
          await this.createDefaultUserSettings(user.$id);
        }
      }
      
      return user;
    } catch (error) {
      console.error('🔍 OAuth token callback handling failed:', error);
      throw error;
    }
  }

  async checkActiveSession() {
    try {
      // Check if there's an active session
      const session = await account.getSession('current');
      return session;
    } catch (error) {
      return null;
    }
  }

  async logout() {
    try {
      return await account.deleteSession('current');
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const user = await account.get();
      return user;
    } catch (error: any) {
      // Handle specific 401 errors on production
      if (error?.code === 401 || error?.message?.includes('missing scopes')) {
        // Try to get session first, then user
        try {
          const session = await account.getSession('current');
          if (session) {
            const user = await account.get();
            return user;
          }
        } catch (sessionError) {
          // Session might be expired or invalid
          return null;
        }
      }
      return null;
    }
  }

  async getCurrentSession() {
    try {
      return await account.getSession('current');
    } catch (error) {
      return null;
    }
  }

  private async createDefaultUserSettings(userId: string) {
    const defaultSettings: Omit<AppwriteUserSettings, '$id' | '$updatedAt'> = {
      theme: 'system',
      focusDuration: 1500, // 25 minutes
      shortBreakDuration: 300, // 5 minutes  
      longBreakDuration: 900, // 15 minutes
      autoStartNext: false,
      goalMinutes: 120,
      longBreakEvery: 4,
      enableSound: true,
      enableNotifications: false,
      showTimerInTab: true, // Default enabled
      // Calendar defaults
      calendarDefaultView: 'week',
      calendarWeekStartsOnMonday: true,
      calendarShowWeekends: true,
      calendarDefaultFocusDuration: 1500, // 25 minutes
      calendarAutoScheduleTasks: false,
      calendarReminderMinutes: [15, 5],
      calendarTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      userId,
    };

    try {
      await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.userSettings,
        ID.unique(),
        defaultSettings,
        getUserPermissions(userId)
      );
    } catch (error) {
      console.error('Failed to create default settings:', error);
    }
  }
}

// Task service
export class TaskService {
  async getTasks(userId: string): Promise<AppwriteTask[]> {
    try {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.tasks,
        [
          Query.equal('userId', userId),
          Query.orderDesc('$createdAt'),
          Query.limit(1000) // Adjust based on needs
        ]
      );
      return response.documents as unknown as AppwriteTask[];
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      throw error;
    }
  }

  async createTask(task: Omit<AppwriteTask, '$id' | '$createdAt' | '$updatedAt'>) {
    try {
      return await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.tasks,
        ID.unique(),
        task,
        getUserPermissions(task.userId)
      ) as unknown as AppwriteTask;
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  }

  async updateTask(taskId: string, updates: Partial<AppwriteTask>) {
    try {
      return await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.tasks,
        taskId,
        updates
      ) as unknown as AppwriteTask;
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  }

  async deleteTask(taskId: string) {
    try {
      return await databases.deleteDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.tasks,
        taskId
      );
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  }
}

// Pomodoro service
export class PomodoroService {
  async getSessions(userId: string): Promise<AppwritePomodoroSession[]> {
    try {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.pomodoroSessions,
        [
          Query.equal('userId', userId),
          Query.orderDesc('$createdAt'),
          Query.limit(500)
        ]
      );
      return response.documents as unknown as AppwritePomodoroSession[];
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      throw error;
    }
  }

  async createSession(session: Omit<AppwritePomodoroSession, '$id' | '$createdAt'>) {
    try {
      return await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.pomodoroSessions,
        ID.unique(),
        session,
        getUserPermissions(session.userId)
      ) as unknown as AppwritePomodoroSession;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }
}

// Notes service
export class NotesService {
  async getNotes(userId: string): Promise<AppwriteNote[]> {
    try {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.notes,
        [
          Query.equal('userId', userId),
          Query.orderDesc('$updatedAt'),
          Query.limit(1000)
        ]
      );
      return response.documents as unknown as AppwriteNote[];
    } catch (error) {
      console.error('Failed to fetch notes:', error);
      throw error;
    }
  }

  async createNote(note: Omit<AppwriteNote, '$id' | '$createdAt' | '$updatedAt'>) {
    try {
      return await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.notes,
        ID.unique(),
        note,
        getUserPermissions(note.userId)
      ) as unknown as AppwriteNote;
    } catch (error) {
      console.error('Failed to create note:', error);
      throw error;
    }
  }

  async updateNote(noteId: string, updates: Partial<AppwriteNote>) {
    try {
      return await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.notes,
        noteId,
        updates
      ) as unknown as AppwriteNote;
    } catch (error) {
      console.error('Failed to update note:', error);
      throw error;
    }
  }

  async deleteNote(noteId: string) {
    try {
      return await databases.deleteDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.notes,
        noteId
      );
    } catch (error) {
      console.error('Failed to delete note:', error);
      throw error;
    }
  }

  async getFolders(userId: string): Promise<AppwriteFolder[]> {
    try {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.folders,
        [
          Query.equal('userId', userId),
          Query.orderAsc('name'),
          Query.limit(200)
        ]
      );
      return response.documents as unknown as AppwriteFolder[];
    } catch (error) {
      console.error('Failed to fetch folders:', error);
      throw error;
    }
  }

  async createFolder(folder: Omit<AppwriteFolder, '$id' | '$createdAt'>) {
    try {
      return await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.folders,
        ID.unique(),
        folder,
        getUserPermissions(folder.userId)
      ) as unknown as AppwriteFolder;
    } catch (error) {
      console.error('Failed to create folder:', error);
      throw error;
    }
  }
}

// Settings service
export class SettingsService {
  async getUserSettings(userId: string): Promise<AppwriteUserSettings | null> {
    try {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.userSettings,
        [Query.equal('userId', userId)]
      );
      return response.documents[0] as unknown as AppwriteUserSettings || null;
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      return null;
    }
  }

  async updateSettings(settingsId: string, updates: Partial<AppwriteUserSettings>) {
    try {
      return await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.userSettings,
        settingsId,
        updates
      ) as unknown as AppwriteUserSettings;
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  }
}

// Calendar service
export class CalendarService {
  async getEvents(userId: string, startDate?: string, endDate?: string): Promise<AppwriteCalendarEvent[]> {
    try {
      const queries = [
        Query.equal('userId', userId),
        Query.orderAsc('startTime'),
        Query.limit(1000)
      ];

      if (startDate && endDate) {
        queries.push(
          Query.greaterThanEqual('startTime', startDate),
          Query.lessThanEqual('startTime', endDate)
        );
      }

      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.calendarEvents,
        queries
      );
      return response.documents as unknown as AppwriteCalendarEvent[];
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
      throw error;
    }
  }

  async createEvent(event: Omit<AppwriteCalendarEvent, '$id' | '$createdAt' | '$updatedAt'>) {
    try {
      return await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.calendarEvents,
        ID.unique(),
        event,
        getUserPermissions(event.userId)
      ) as unknown as AppwriteCalendarEvent;
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      throw error;
    }
  }

  async updateEvent(eventId: string, updates: Partial<AppwriteCalendarEvent>) {
    try {
      return await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.calendarEvents,
        eventId,
        updates
      ) as unknown as AppwriteCalendarEvent;
    } catch (error) {
      console.error('Failed to update calendar event:', error);
      throw error;
    }
  }

  async deleteEvent(eventId: string) {
    try {
      return await databases.deleteDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.calendarEvents,
        eventId
      );
    } catch (error) {
      console.error('Failed to delete calendar event:', error);
      throw error;
    }
  }

  async getTimeBlocks(userId: string, date: string): Promise<AppwriteTimeBlock[]> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.timeBlocks,
        [
          Query.equal('userId', userId),
          Query.greaterThanEqual('startTime', startOfDay.toISOString()),
          Query.lessThanEqual('startTime', endOfDay.toISOString()),
          Query.orderAsc('startTime')
        ]
      );
      return response.documents as unknown as AppwriteTimeBlock[];
    } catch (error) {
      console.error('Failed to fetch time blocks:', error);
      throw error;
    }
  }

  async createTimeBlock(timeBlock: Omit<AppwriteTimeBlock, '$id' | '$createdAt' | '$updatedAt'>) {
    try {
      return await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.timeBlocks,
        ID.unique(),
        timeBlock,
        getUserPermissions(timeBlock.userId)
      ) as unknown as AppwriteTimeBlock;
    } catch (error) {
      console.error('Failed to create time block:', error);
      throw error;
    }
  }

  async getProductivityGoals(userId: string, type?: 'daily' | 'weekly' | 'monthly'): Promise<AppwriteProductivityGoal[]> {
    try {
      const queries = [
        Query.equal('userId', userId),
        Query.orderDesc('date'),
        Query.limit(100)
      ];

      if (type) {
        queries.push(Query.equal('type', type));
      }

      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.productivityGoals,
        queries
      );
      return response.documents as unknown as AppwriteProductivityGoal[];
    } catch (error) {
      console.error('Failed to fetch productivity goals:', error);
      throw error;
    }
  }

  async createProductivityGoal(goal: Omit<AppwriteProductivityGoal, '$id' | '$createdAt' | '$updatedAt'>) {
    try {
      return await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.productivityGoals,
        ID.unique(),
        goal,
        getUserPermissions(goal.userId)
      ) as unknown as AppwriteProductivityGoal;
    } catch (error) {
      console.error('Failed to create productivity goal:', error);
      throw error;
    }
  }

  async updateProductivityGoal(goalId: string, updates: Partial<AppwriteProductivityGoal>) {
    try {
      return await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.productivityGoals,
        goalId,
        updates
      ) as unknown as AppwriteProductivityGoal;
    } catch (error) {
      console.error('Failed to update productivity goal:', error);
      throw error;
    }
  }
}

// Export service instances
export const authService = new AuthService();
export const taskService = new TaskService();
export const pomodoroService = new PomodoroService();
export const notesService = new NotesService();
export const settingsService = new SettingsService();
export const calendarService = new CalendarService();

export { client };