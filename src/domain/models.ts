// Primitive helper types
export type ID = string;

export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: ID;
  title: string;
  description?: string;
  priority: TaskPriority;
  tags: string[];
  dueDate: string | null;       
  completed: boolean;
  createdAt: string;            
  updatedAt: string;            
  /** Total focused (Pomodoro) seconds accumulated */
  focusSeconds?: number;
  /** Optional calendar event ID if task is scheduled */
  calendarEventId?: string;
}

// (Removed Habit interface after deprecating Habits feature)
// export interface Habit { ... }
export type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';
export type ProductivityRating = 'great' | 'some-distractions' | 'unfocused';

export interface PomodoroSession {
  id: ID;
  mode: PomodoroMode;
  startedAt: string;    
  durationSec: number;   
  endedAt?: string;      
  aborted?: boolean;
  /** Optional task this session was focusing on */
  taskId?: ID;
  /** User's productivity rating for focus sessions */
  productivityRating?: ProductivityRating;
  /** Optional calendar event that triggered this session */
  calendarEventId?: string;
}

export interface Note {
  id: ID;
  title: string;
  body: string;          
  folderId: ID | null;   // null => root
  taskId?: ID;           // optional linkage to a task
  updatedAt: string;
  createdAt: string;
}

export interface Folder {
  id: ID;
  name: string;
  parentId: ID | null; // null => root
  createdAt: string;
}

// Calendar Event Types
export type CalendarEventType = 'focus' | 'break' | 'task' | 'meeting' | 'personal' | 'goal';
export type CalendarEventStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'missed';
export type RecurrencePattern = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';

export interface CalendarEvent {
  id: ID;
  title: string;
  description?: string;
  type: CalendarEventType;
  status: CalendarEventStatus;
  
  // Timing
  startTime: string;  // ISO datetime
  endTime: string;    // ISO datetime
  allDay: boolean;
  
  // Recurrence
  recurrence: RecurrencePattern;
  recurrenceEndDate?: string;
  recurrenceData?: {
    interval: number;  // every N days/weeks/months
    daysOfWeek?: number[];  // for weekly: [0,1,2,3,4,5,6]
    dayOfMonth?: number;    // for monthly
  };
  
  // Relationships
  taskId?: ID;           // linked task
  pomodoroSessionId?: ID; // linked session
  parentEventId?: ID;     // for recurring events
  
  // Focus-specific fields
  focusDuration?: number;     // planned focus time in seconds
  actualFocusTime?: number;   // actual time spent
  productivityRating?: ProductivityRating;
  goalMinutes?: number;       // daily/session goal
  
  // Metadata
  color?: string;     // hex color for display
  location?: string;
  attendees?: string[];
  reminders?: number[]; // minutes before event
  tags: string[];
  
  // Google Calendar sync fields
  googleCalendarId?: string;    // ID of the event in Google Calendar
  googleCalendarEtag?: string;  // Etag for change tracking
  source?: 'local' | 'google' | 'synced';  // Where the event originated
  lastSyncedAt?: string;        // When this event was last synced
  
  // Time tracking
  createdAt: string;
  updatedAt: string;
}

export interface CalendarView {
  type: 'month' | 'week' | 'day' | 'agenda';
  date: string;  // current viewing date
}

export interface TimeBlock {
  id: ID;
  title: string;
  startTime: string;
  endTime: string;
  type: 'focus' | 'break' | 'buffer';
  taskIds: ID[];
  color?: string;
  flexible: boolean;  // can be moved/adjusted
}

export interface ProductivityGoal {
  id: ID;
  type: 'daily' | 'weekly' | 'monthly';
  targetMinutes: number;
  currentMinutes: number;
  date: string;  // goal period start date
  achieved: boolean;
}

export interface PomodoroDurations {
  focus: number;      
  shortBreak: number;
  longBreak: number;
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  pomodoroDurations: PomodoroDurations;
  autoStartNext: boolean;
  // Calendar settings
  calendar: {
    defaultView: CalendarView['type'];
    weekStartsOnMonday: boolean;
    showWeekends: boolean;
    defaultFocusDuration: number;
    autoScheduleTasks: boolean;
    reminderMinutes: number[];
    timeZone: string;
  };
}

export interface AppStateSnapshot {
  tasks: Task[];
  pomodoroSessions: PomodoroSession[];
  notes: Note[];
  folders: Folder[];
  calendarEvents: CalendarEvent[];
  timeBlocks: TimeBlock[];
  productivityGoals: ProductivityGoal[];
  settings: Settings;
}