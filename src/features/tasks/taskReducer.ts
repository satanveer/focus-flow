import type { Task } from '../../domain/models';
import {
  ADD_TASK, UPDATE_TASK, TOGGLE_TASK, REMOVE_TASK,
  BULK_COMPLETE, CLEAR_COMPLETED, type TaskActions
} from './taskTypes';

function updateTaskArray(tasks: Task[], id: string, updater: (t: Task) => Task): Task[] {
  return tasks.map(t => t.id === id ? updater(t) : t);
}

export function taskReducer(state: Task[], action: TaskActions): Task[] {
  switch (action.type) {
    case ADD_TASK:
      return [action.payload, ...state];
    case UPDATE_TASK:
      return updateTaskArray(state, action.payload.id, t => ({
        ...t,
        ...action.payload.updates,
        updatedAt: new Date().toISOString(),
      }));
    case TOGGLE_TASK:
      return updateTaskArray(state, action.payload.id, t => ({
        ...t,
        completed: !t.completed,
        updatedAt: new Date().toISOString(),
      }));
    case REMOVE_TASK:
      return state.filter(t => t.id !== action.payload.id);
    case BULK_COMPLETE: {
      const { ids, completed } = action.payload;
      const now = new Date().toISOString();
      const idSet = new Set(ids);
      return state.map(t =>
        idSet.has(t.id)
          ? (t.completed === completed
              ? t
              : { ...t, completed, updatedAt: now })
          : t
      );
    }
    case CLEAR_COMPLETED:
      return state.filter(t => !t.completed);
    default:
      return state;
  }
}