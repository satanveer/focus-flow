import type { Task, TaskPriority } from '../../domain/models';

export const ADD_TASK = 'tasks/ADD';
export const UPDATE_TASK = 'tasks/UPDATE';
export const TOGGLE_TASK = 'tasks/TOGGLE';
export const REMOVE_TASK = 'tasks/REMOVE';
export const BULK_COMPLETE = 'tasks/BULK_COMPLETE';
export const CLEAR_COMPLETED = 'tasks/CLEAR_COMPLETED';

export interface AddTaskAction {
  type: typeof ADD_TASK;
  payload: Task;
}
export interface UpdateTaskAction {
  type: typeof UPDATE_TASK;
  payload: { id: string; updates: Partial<Omit<Task, 'id' | 'createdAt'>> };
}
export interface ToggleTaskAction {
  type: typeof TOGGLE_TASK;
  payload: { id: string };
}
export interface RemoveTaskAction {
  type: typeof REMOVE_TASK;
  payload: { id: string };
}
export interface BulkCompleteAction {
  type: typeof BULK_COMPLETE;
  payload: { ids: string[]; completed: boolean };
}
export interface ClearCompletedAction {
  type: typeof CLEAR_COMPLETED;
}

export type TaskActions =
  | AddTaskAction
  | UpdateTaskAction
  | ToggleTaskAction
  | RemoveTaskAction
  | BulkCompleteAction
  | ClearCompletedAction;

export function createTask(input: {
  title: string;
  description?: string;
  priority?: TaskPriority;
  tags?: string[];
  dueDate?: string | null;
}): Task {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    description: input.description?.trim() || '',
    priority: input.priority || 'medium',
    tags: input.tags?.map(t => t.trim()).filter(Boolean) || [],
    dueDate: input.dueDate || null,
    completed: false,
    createdAt: now,
    updatedAt: now,
  };
}