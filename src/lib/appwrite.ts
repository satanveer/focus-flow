import { Client, Account, Databases, Query, Permission, Role, ID, OAuthProvider } from 'appwrite';
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
  userId: string;
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
      console.error('Registration failed:', error);
      throw error;
    }
  }

  async login(email: string, password: string) {
    try {
      return await account.createEmailPasswordSession(email, password);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async loginWithGoogle() {
    try {
      // Redirect to Google OAuth
      const redirectUrl = `${window.location.origin}`;
      await account.createOAuth2Session(OAuthProvider.Google, redirectUrl, redirectUrl);
    } catch (error) {
      console.error('Google OAuth failed:', error);
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
    } catch (error) {
      console.log('getCurrentUser failed:', error);
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

// Export service instances
export const authService = new AuthService();
export const taskService = new TaskService();
export const pomodoroService = new PomodoroService();
export const notesService = new NotesService();
export const settingsService = new SettingsService();

export { client };