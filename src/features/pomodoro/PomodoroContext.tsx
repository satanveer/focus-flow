import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import type { ID, PomodoroMode, PomodoroSession, ProductivityRating } from '../../domain/models';
import { useLocalStorageState } from '../../hooks/useLocalStorageState';
import { googleCalendarService } from '../../lib/googleCalendar';
import { calendarService } from '../../lib/appwrite';
import { useTasksContext } from '../tasks/TasksContext';
import { useAppwritePomodoro } from './AppwritePomodoroContext';
import { useAuth } from '../../contexts/AuthContext';

interface ActiveTimer {
  sessionId: ID;
  taskId?: ID;
  mode: PomodoroMode;
  startedAt: string; // actual start time (adjusted on resume)
  targetEnd: string; // computed end time
  durationSec: number;
  paused?: boolean;
  remainingSec?: number; // captured when paused
}

interface PomodoroState {
  sessions: PomodoroSession[];
  active?: ActiveTimer;
  focusDurations: { focus: number; shortBreak: number; longBreak: number };
  autoStartNext: boolean;
  focusCycleCount: number; // number of completed focus sessions since last long break
  goalMinutes: number; // daily focus goal in minutes
  creditMode: 'full' | 'elapsed'; // how to credit manual completion of focus sessions
  longBreakEvery: number; // how many focus sessions before a long break
  enableSound: boolean;
  enableNotifications: boolean;
  showTimerInTab: boolean;
}

interface PomodoroContextValue extends PomodoroState {
  start: (opts: { mode?: PomodoroMode; taskId?: ID; durationSec?: number }) => void;
  pause: () => void;
  resume: () => void;
  abort: () => void;
  complete: () => void; // force complete early
  updateSessionProductivity: (sessionId: ID, rating: ProductivityRating) => void;
  getRemaining: () => number; // seconds
  updateDurations: (d: Partial<{ focus: number; shortBreak: number; longBreak: number }>) => void;
  toggleAutoStart: () => void;
  updateGoal: (minutes: number) => void;
  updateCreditMode: (mode: 'full' | 'elapsed') => void;
  updateLongBreakEvery: (n: number) => void;
  toggleSound: () => void;
  toggleNotifications: () => void;
  toggleTimerInTab: () => void;
}

const DEFAULTS = { focus: 25 * 60, shortBreak: 5 * 60, longBreak: 15 * 60 };

const PomodoroContext = createContext<PomodoroContextValue | null>(null);

export const PomodoroProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get user context for calendar event creation
  const { user } = useAuth();
  
  // Use Appwrite for sessions storage
  const { sessions: appwriteSessions, createSession: createAppwriteSession, updateSession: updateAppwriteSession } = useAppwritePomodoro();
  
  // Use localStorage only for settings (not sessions)
  const [settings, setSettings] = useLocalStorageState<Omit<PomodoroState, 'sessions'>>('ff/pomodoro-settings', {
    active: undefined,
    focusDurations: DEFAULTS,
    autoStartNext: false,
    focusCycleCount: 0,
    goalMinutes: 120,
    creditMode: 'full',
    longBreakEvery: 4,
    enableSound: true,
    enableNotifications: false,
    showTimerInTab: true,
  });
  
  // Track which sessions have been saved to avoid duplicates
  const savedSessionIdsRef = useRef<Set<string>>(new Set());
  
  // Combine Appwrite sessions with localStorage settings
  const [state, setState] = useState<PomodoroState>({
    ...settings,
    sessions: appwriteSessions,
  });
  
  // Update state when Appwrite sessions change
  useEffect(() => {
    setState(prev => ({
      ...prev,
      sessions: appwriteSessions,
    }));
  }, [appwriteSessions]);
  
  // Update state when settings change
  useEffect(() => {
    setState(prev => ({
      ...prev,
      ...settings,
    }));
  }, [settings]);
  
  // Custom setState that intercepts session additions and saves to Appwrite
  const setStateWithAppwrite = useCallback((updater: (prev: PomodoroState) => PomodoroState) => {
    setState(prevState => {
      const newState = updater(prevState);
      
      // Check if new sessions were added
      if (newState.sessions.length > prevState.sessions.length) {
        const newSessions = newState.sessions.filter(
          ns => !prevState.sessions.some(ps => ps.id === ns.id)
        );
        
        // Save new sessions to Appwrite (async, don't block state update)
        newSessions.forEach(session => {
          if (!savedSessionIdsRef.current.has(session.id)) {
            savedSessionIdsRef.current.add(session.id);
            createAppwriteSession(session).catch(error => {
              console.error('Failed to save session to Appwrite:', error);
              savedSessionIdsRef.current.delete(session.id);
            });
          }
        });
      }
      
      // Update localStorage settings (exclude sessions)
      const { sessions: _, ...newSettings } = newState;
      setSettings(newSettings);
      
      return newState;
    });
  }, [createAppwriteSession, setSettings]);
  
  // Also handle session updates
  const handleUpdateSession = useCallback((sessionId: ID, rating: ProductivityRating) => {
    // Update in Appwrite
    updateAppwriteSession(sessionId, { productivityRating: rating }).catch(error => {
      console.error('Failed to update session in Appwrite:', error);
    });
    
    // Update local state optimistically
    setState(prev => ({
      ...prev,
      sessions: prev.sessions.map(s => 
        s.id === sessionId ? { ...s, productivityRating: rating } : s
      ),
    }));
  }, [updateAppwriteSession]);

  // Try to get tasks context, but handle case where it might not be available
  let tasks: any[] = [];
  try {
    const tasksContext = useTasksContext();
    tasks = tasksContext.tasks || [];
  } catch (error) {
    // TasksContext not available yet, use empty array
    console.warn('TasksContext not available, using empty tasks array');
  }

  const tickRef = useRef<number | null>(null);

  // Side-effect helper: play sound & show notification when a session (focus or break) ends
  const fireSessionEndEffects = useCallback(async (s: PomodoroState, mode: PomodoroMode, sessionData?: { sessionId: string; startedAt: string; durationSec: number; taskId?: string }, skipGoogleCalendarLogging = false) => {
    try {
      if (s.enableSound) {
        const AudioCtx: any = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          if (ctx.state === 'suspended') ctx.resume?.();
          const osc = ctx.createOscillator();
            const gain = ctx.createGain();
          osc.type = 'sine';
          // Slightly different tone sets for focus vs breaks
          const baseFreq = mode === 'focus' ? 880 : mode === 'shortBreak' ? 660 : 523.25;
          osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
          gain.gain.setValueAtTime(0.0001, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.4);
          osc.connect(gain).connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 1.45);
        }
      }
      if (s.enableNotifications && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(`${mode === 'focus' ? 'Focus' : mode === 'shortBreak' ? 'Short break' : 'Long break'} session completed`, { body: 'Time for the next step!' });
        } else if (Notification.permission === 'default') {
          Notification.requestPermission();
        }
      }

      // Log to Google Calendar if authenticated and session data is provided (and not skipped to prevent duplicates)
      if (sessionData && !skipGoogleCalendarLogging) {
        // Create a more robust session key using multiple identifiers
        const sessionKey = `${sessionData.sessionId}-${sessionData.startedAt}-${sessionData.durationSec}-${sessionData.taskId || 'no-task'}`;
        
        // Check if this session has already been logged
        const loggedSessions = JSON.parse(localStorage.getItem('logged_sessions') || '[]');
        
        if (loggedSessions.includes(sessionKey)) {
          console.log('⏭️ Session already logged, skipping duplicate:', sessionKey);
          return;
        }

        // Add to logged sessions immediately to prevent race conditions
        const updatedLoggedSessions = [...loggedSessions, sessionKey];
        localStorage.setItem('logged_sessions', JSON.stringify(updatedLoggedSessions));
        
        console.log('📝 Logging session:', {
          sessionId: sessionData.sessionId,
          durationSec: sessionData.durationSec,
          durationMin: Math.floor(sessionData.durationSec / 60),
          taskId: sessionData.taskId
        });
        
        const hasValidTokens = await googleCalendarService.hasValidTokens();
        
        // Always log to internal calendar first (if user is authenticated)
        try {
          const startTime = new Date(sessionData.startedAt);
          const endTime = new Date(startTime.getTime() + sessionData.durationSec * 1000);
          
          // Get actual task title if taskId is provided
          let taskTitle: string | undefined;
          let task: any;
          if (sessionData.taskId) {
            task = tasks.find(t => t.id === sessionData.taskId);
            taskTitle = task ? task.title : undefined;
          }
          
          if (mode === 'focus' && user?.$id) {
            // Log to internal Appwrite calendar
            const durationMinutes = Math.floor(sessionData.durationSec / 60);
            const durationHours = Math.floor(durationMinutes / 60);
            const remainingMinutes = durationMinutes % 60;
            
            let durationText = '';
            if (durationHours > 0) {
              durationText = `${durationHours}h ${remainingMinutes}m`;
            } else {
              durationText = `${durationMinutes} minute${durationMinutes !== 1 ? 's' : ''}`;
            }
            
            const eventTitle = taskTitle || `Focus Session`;
            const eventDescription = `🎯 **Deep Focus Session**\n\n**Duration:** ${durationText}\n${taskTitle ? `**Task:** ${taskTitle}\n` : ''}${task?.description ? `**Details:** ${task.description}\n` : ''}\n📊 Logged automatically by Focus Flow`;
            
            const calendarEvent = {
              title: eventTitle,
              description: eventDescription,
              type: 'focus' as const,
              status: 'completed' as const,
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString(),
              allDay: false,
              recurrence: 'none' as const,
              recurrenceInterval: 0,
              focusDuration: sessionData.durationSec,
              actualFocusTime: sessionData.durationSec,
              taskId: sessionData.taskId,
              pomodoroSessionId: sessionData.sessionId,
              source: 'local' as const,
              tags: JSON.stringify(['focus', 'pomodoro']),
              attendees: JSON.stringify([]),
              reminders: JSON.stringify([]),
              userId: user.$id,
            };
            
            // Create event in internal calendar
            try {
              await calendarService.createEvent(calendarEvent);
              console.log('✅ Focus session logged to internal calendar:', eventTitle);
            } catch (calendarError) {
              console.error('Failed to log to internal calendar:', calendarError);
              // Log detailed error for debugging
              if (calendarError instanceof Error) {
                console.error('Error details:', calendarError.message);
              }
            }
          } else if (mode === 'focus' && !user?.$id) {
            console.warn('⚠️ Cannot log to internal calendar: User not authenticated');
          }
          
          // Also log to Google Calendar if connected
          if (hasValidTokens && mode === 'focus') {
            try {
              const eventData = googleCalendarService.createFocusSessionEvent({
                startTime: new Date(sessionData.startedAt),
                endTime: new Date(new Date(sessionData.startedAt).getTime() + sessionData.durationSec * 1000),
                duration: sessionData.durationSec,
                taskTitle,
                title: taskTitle // Explicitly pass taskTitle as title to ensure it's used
              });
              
              await googleCalendarService.createEvent(eventData);
              console.log('✅ Focus session logged to Google Calendar:', taskTitle || 'Focus Session');
            } catch (error) {
              console.error('Failed to log focus session to Google Calendar:', error);
            }
          }
        } catch (error) {
          console.error('Error logging session to calendar:', error);
          // Remove from logged sessions if logging failed
          const failedLoggedSessions = JSON.parse(localStorage.getItem('logged_sessions') || '[]');
          const filteredSessions = failedLoggedSessions.filter((key: string) => key !== sessionKey);
          localStorage.setItem('logged_sessions', JSON.stringify(filteredSessions));
        }
      }
    } catch {
      // swallow errors silently (audio/notification failures)
    }
  }, [tasks, user]);

  const clearTick = () => { if (tickRef.current) cancelAnimationFrame(tickRef.current); tickRef.current = null; };

  const getRemaining = useCallback(() => {
    if (!state.active) return 0;
    if (state.active.paused && state.active.remainingSec !== undefined) return state.active.remainingSec;
    const end = new Date(state.active.targetEnd).getTime();
    const now = Date.now();
    return Math.max(0, Math.round((end - now) / 1000));
  }, [state.active]);

  // Auto-complete when time hits zero
  useEffect(() => {
  if (!state.active || state.active.paused) { clearTick(); return; }
    const loop = () => {
      if (getRemaining() <= 0) {
        // finalize session
        setStateWithAppwrite(s => {
          if (!s.active) return s;
          const { sessionId, mode, startedAt, durationSec, taskId } = s.active;
          const session: PomodoroSession = { id: sessionId, mode, startedAt, durationSec, endedAt: new Date().toISOString(), taskId };
          // Determine next mode if auto start enabled
          let next: PomodoroMode | undefined;
          let focusCycleCount = s.focusCycleCount;
          if (s.autoStartNext) {
            if (mode === 'focus') {
              focusCycleCount += 1;
              // every <longBreakEvery>th focus leads to a long break
              next = (focusCycleCount % s.longBreakEvery === 0) ? 'longBreak' : 'shortBreak';
            } else {
              next = 'focus';
            }
          }
          let active: ActiveTimer | undefined = undefined;
            if (next) {
              const duration = next === 'focus'
                ? s.focusDurations.focus
                : next === 'shortBreak'
                  ? s.focusDurations.shortBreak
                  : s.focusDurations.longBreak;
              const now2 = new Date();
              const end2 = new Date(now2.getTime() + duration * 1000);
              active = {
                sessionId: crypto.randomUUID(),
                mode: next,
                startedAt: now2.toISOString(),
                targetEnd: end2.toISOString(),
                durationSec: duration,
              };
            }
          // Fire side-effects after state update (sound/notification)
          queueMicrotask(() => {
            fireSessionEndEffects(s, mode, { sessionId, startedAt, durationSec, taskId }).catch(err => 
              console.error('Error in fireSessionEndEffects:', err)
            );
          });
          return {
            ...s,
            active,
            focusCycleCount,
            sessions: [...s.sessions, session]
          };
        });
        clearTick();
        return;
      }
      tickRef.current = requestAnimationFrame(loop);
    };
    tickRef.current = requestAnimationFrame(loop);
    return clearTick;
  }, [state.active, getRemaining, setStateWithAppwrite]);

  const start: PomodoroContextValue['start'] = ({ mode = 'focus', taskId, durationSec }) => {
    const duration = durationSec || (mode === 'focus' ? state.focusDurations.focus : mode === 'shortBreak' ? state.focusDurations.shortBreak : state.focusDurations.longBreak);
    const now = new Date();
    const end = new Date(now.getTime() + duration * 1000);
    setStateWithAppwrite(s => ({ ...s, active: { sessionId: crypto.randomUUID(), taskId, mode, startedAt: now.toISOString(), targetEnd: end.toISOString(), durationSec: duration } }));
  };

  const pause = () => setStateWithAppwrite(s => {
    if (!s.active || s.active.paused) return s;
    const remaining = getRemaining();
    return { ...s, active: { ...s.active, paused: true, remainingSec: remaining } };
  });

  const resume = () => setStateWithAppwrite(s => {
    if (!s.active || !s.active.paused) return s;
    const now = new Date();
    const duration = s.active.remainingSec || 0;
    const end = new Date(now.getTime() + duration * 1000);
    return { ...s, active: { ...s.active, paused: false, startedAt: now.toISOString(), targetEnd: end.toISOString(), durationSec: s.active.durationSec } };
  });

  const abort = () => setStateWithAppwrite(s => ({ ...s, active: undefined }));

  const complete = () => setStateWithAppwrite(s => {
    if (!s.active) return s;
    const { sessionId, mode, startedAt, durationSec, taskId, paused, remainingSec } = s.active;
    let credited = durationSec;
    if (mode === 'focus' && s.creditMode === 'elapsed') {
      // compute elapsed time
      let remaining: number | undefined = undefined;
      if (paused && typeof remainingSec === 'number') remaining = remainingSec; else {
        const rem = new Date(s.active.targetEnd).getTime() - Date.now();
        remaining = Math.max(0, Math.round(rem/1000));
      }
      const elapsed = Math.max(0, durationSec - (remaining || 0));
      credited = Math.min(durationSec, Math.max(1, elapsed)); // at least 1s
    }
    const session: PomodoroSession = { id: sessionId, mode, startedAt, durationSec: credited, endedAt: new Date().toISOString(), taskId, aborted: false };
    let focusCycleCount = s.focusCycleCount;
    if (mode === 'focus') focusCycleCount += 1;
    // Side effects for manual completion - DO log to calendar (removed skip flag)
    queueMicrotask(() => {
      fireSessionEndEffects(s, mode, { sessionId, startedAt, durationSec: credited, taskId }, false).catch(err =>
        console.error('Error in fireSessionEndEffects:', err)
      );
    });
    return { ...s, active: undefined, sessions: [...s.sessions, session], focusCycleCount };
  });

  const updateDurations: PomodoroContextValue['updateDurations'] = (d) => {
    setStateWithAppwrite(s => ({ ...s, focusDurations: { ...s.focusDurations, ...d } }));
  };

  const toggleAutoStart = () => setStateWithAppwrite(s => ({ ...s, autoStartNext: !s.autoStartNext }));

  const updateGoal: PomodoroContextValue['updateGoal'] = (minutes) => {
    if (!Number.isFinite(minutes) || minutes <= 0) return;
    setStateWithAppwrite(s => ({ ...s, goalMinutes: Math.round(minutes) }));
  };

  const updateCreditMode: PomodoroContextValue['updateCreditMode'] = (mode) => {
    setStateWithAppwrite(s => ({ ...s, creditMode: mode }));
  };

  const updateLongBreakEvery: PomodoroContextValue['updateLongBreakEvery'] = (n) => {
    if (!Number.isFinite(n) || n < 1 || n > 12) return;
    setStateWithAppwrite(s => ({ ...s, longBreakEvery: Math.round(n) }));
  };

  const toggleSound = () => setStateWithAppwrite(s => ({ ...s, enableSound: !s.enableSound }));
  const toggleNotifications = () => setStateWithAppwrite(s => ({ ...s, enableNotifications: !s.enableNotifications }));
  const toggleTimerInTab = () => setStateWithAppwrite(s => ({ ...s, showTimerInTab: !s.showTimerInTab }));
  
  const updateSessionProductivity = useCallback((sessionId: ID, rating: ProductivityRating) => {
    handleUpdateSession(sessionId, rating);
  }, [handleUpdateSession]);
  
  // Auto-request permission when enabling notifications
  useEffect(() => {
    if (state.enableNotifications && 'Notification' in window && Notification.permission === 'default') {
      try { Notification.requestPermission(); } catch {}
    }
  }, [state.enableNotifications]);

  const value: PomodoroContextValue = {
    ...state,
    start,
    pause,
    resume,
    abort,
    complete,
    getRemaining,
    updateDurations,
    toggleAutoStart,
    updateGoal,
    updateCreditMode,
    updateLongBreakEvery,
    toggleSound,
    toggleNotifications,
    toggleTimerInTab,
    updateSessionProductivity,
  };

  return <PomodoroContext.Provider value={value}>{children}</PomodoroContext.Provider>;
};

export function usePomodoro() {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error('usePomodoro must be used within <PomodoroProvider>');
  return ctx;
}