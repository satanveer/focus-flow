import { useEffect, useRef } from 'react';
import { usePomodoro } from './PomodoroContext';
import { useAppwriteTasksContext } from '../tasks/AppwriteTasksContext';

// Watches pomodoro sessions and credits elapsed focus time to tasks.
export function TaskFocusBinder() {
  const { sessions } = usePomodoro();
  let tasksCtx: ReturnType<typeof useAppwriteTasksContext> | null = null;
  try { tasksCtx = useAppwriteTasksContext(); } catch { /* provider not present on some early renders */ }
  const updateTask = tasksCtx?.updateTask;
  const tasks = tasksCtx?.tasks || [];
  const lastCount = useRef(0);

  useEffect(() => {
    if (sessions.length === lastCount.current) return;
    const newSessions = sessions.slice(lastCount.current);
    lastCount.current = sessions.length;
  if (!updateTask) return; // context not mounted
  newSessions.forEach(s => {
      if (s.mode !== 'focus' || !s.taskId || !s.endedAt) return;
      // Requirement: manual complete should credit full scheduled duration, not only elapsed.
      // We now always credit full planned durationSec for focus sessions.
      const elapsed = s.durationSec;
      const task = tasks.find(t => t.id === s.taskId);
      if (!task) return;
      const current = task.focusSeconds || 0;
      updateTask(task.id, { focusSeconds: current + elapsed });
    });
  }, [sessions, updateTask, tasks]);

  return null;
}