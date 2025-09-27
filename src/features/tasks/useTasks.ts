import { useReducer, useEffect, useMemo, useCallback } from 'react';
import { taskReducer } from './taskReducer';
import { createTask,
  ADD_TASK, UPDATE_TASK, TOGGLE_TASK, REMOVE_TASK,
  BULK_COMPLETE, CLEAR_COMPLETED
} from './taskTypes';
import type { Task, TaskPriority } from '../../domain/models';
import { useLocalStorageState } from '../../hooks/useLocalStorageState';

const STORAGE_KEY = 'ff.tasks.v1';

export interface TaskFilters {
  search: string;
  priorities: TaskPriority[];  // empty = all
  hideCompleted: boolean;
  tag?: string | null;
}

const defaultFilters: TaskFilters = {
  search: '',
  priorities: [],
  hideCompleted: false,
  tag: null
};

export function useTasks() {
  // Persisted baseline
  const [persisted, setPersisted] = useLocalStorageState<Task[]>(STORAGE_KEY, []);
  const [tasks, dispatch] = useReducer(taskReducer, persisted.map(t => ({ ...t, focusSeconds: t.focusSeconds ?? 0 })));

  // Sync reducer state to localStorage
  useEffect(() => {
    setPersisted(tasks);
  }, [tasks, setPersisted]);

  // Filters local state (could also expose setters)
  const [filters, setFilters] = useReducer(
    (state: TaskFilters, patch: Partial<TaskFilters>) => ({ ...state, ...patch }),
    defaultFilters
  );

  // Actions
  const addTask = useCallback((data: {
    title: string;
    description?: string;
    priority?: TaskPriority;
    tags?: string[];
    dueDate?: string | null;
  }) => {
    if (!data.title.trim()) return; // basic validation
    dispatch({ type: ADD_TASK, payload: createTask(data) });
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
    if (updates.title && !updates.title.trim()) return;
    dispatch({ type: UPDATE_TASK, payload: { id, updates } });
  }, []);

  const toggleTask = useCallback((id: string) => {
    dispatch({ type: TOGGLE_TASK, payload: { id } });
  }, []);

  const removeTask = useCallback((id: string) => {
    dispatch({ type: REMOVE_TASK, payload: { id } });
  }, []);

  const bulkComplete = useCallback((ids: string[], completed: boolean) => {
    if (!ids.length) return;
    dispatch({ type: BULK_COMPLETE, payload: { ids, completed } });
  }, []);

  const clearCompleted = useCallback(() => {
    dispatch({ type: CLEAR_COMPLETED });
  }, []);

  // Derived sets
  const filteredTasks = useMemo(() => {
    const s = filters.search.toLowerCase();
    return tasks.filter(t => {
      if (filters.hideCompleted && t.completed) return false;
      if (filters.priorities.length && !filters.priorities.includes(t.priority)) return false;
      if (filters.tag && !t.tags.includes(filters.tag)) return false;
      if (s && !(
        t.title.toLowerCase().includes(s) ||
        t.description?.toLowerCase().includes(s) ||
        t.tags.some(tag => tag.toLowerCase().includes(s))
      )) return false;
      return true;
    });
  }, [tasks, filters]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const completionRate = total === 0 ? 0 : completed / total;
    const totalFocusSeconds = tasks.reduce((acc, t) => acc + (t.focusSeconds || 0), 0);
    return { total, completed, completionRate, totalFocusSeconds };
  }, [tasks]);

  return {
    tasks,
    addTask,
    updateTask,
    toggleTask,
    removeTask,
    bulkComplete,
    clearCompleted,
    filters,
    setFilters,
    filteredTasks,
    stats
  };
}
