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
}

export interface Habit {
  id: ID;
  name: string;
  frequency: 'daily' | 'weekly';
  streak: number;
  lastCompletedDate: string | null; 
  historyDates: string[];           
  createdAt: string;
}

export type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

export interface PomodoroSession {
  id: ID;
  mode: PomodoroMode;
  startedAt: string;    
  durationSec: number;   
  endedAt?: string;      
  aborted?: boolean;
  /** Optional task this session was focusing on */
  taskId?: ID;
}

export interface Note {
  id: ID;
  title: string;
  body: string;          
  updatedAt: string;
  createdAt: string;
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
}

export interface AppStateSnapshot {
  tasks: Task[];
  habits: Habit[];
  pomodoroSessions: PomodoroSession[];
  notes: Note[];
  settings: Settings;
}