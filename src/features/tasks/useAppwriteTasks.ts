import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { taskService } from '../../lib/appwrite';
import type { Task, TaskPriority } from '../../domain/models';

interface TasksState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

export function useAppwriteTasks() {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState<TasksState>({
    tasks: [],
    loading: false,
    error: null,
  });

  const setTasks = useCallback((tasks: Task[]) => {
    setState(prev => ({ ...prev, tasks }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  // Convert Appwrite task to domain model
  const appwriteTaskToTask = useCallback((appwriteTask: any): Task => {
    try {
      const domainTask: Task = {
        id: appwriteTask.$id,
        title: appwriteTask.title,
        description: appwriteTask.description || '',
        priority: appwriteTask.priority,
        tags: appwriteTask.tags || [],
        completed: appwriteTask.completed,
        dueDate: appwriteTask.dueDate,
        focusSeconds: appwriteTask.focusSeconds || 0,
        createdAt: appwriteTask.$createdAt,
        updatedAt: appwriteTask.$updatedAt
      };
      
      return domainTask;
    } catch (error) {
      console.error('Error converting Appwrite task to domain model:', error);
      console.error('Invalid task data:', appwriteTask);
      throw error;
    }
  }, []);

  // Load tasks from Appwrite
  const loadTasks = useCallback(async () => {
    if (!user || !isAuthenticated) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const appwriteTasks = await taskService.getTasks(user.$id);
      const domainTasks = appwriteTasks.map(task => appwriteTaskToTask(task as any));
      setTasks(domainTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated, appwriteTaskToTask, setTasks, setLoading, setError]);

  // Add new task
  const addTask = useCallback(async (data: {
    title: string;
    description?: string;
    priority?: TaskPriority;
    dueDate?: Date;
  }) => {
    if (!user || !data.title?.trim()) {
      return;
    }

    try {
      setError(null);
      
      const taskData = {
        title: data.title.trim(),
        description: data.description || '',
        priority: data.priority || 'medium' as TaskPriority,
        completed: false,
        userId: user.$id,
        tags: [],
        dueDate: data.dueDate?.toISOString() || null,
        focusSeconds: 0,
      };

      const appwriteTask = await taskService.createTask(taskData as any);
      const newTask = appwriteTaskToTask(appwriteTask);

      setState(prev => {
        const newTasks = [...prev.tasks, newTask];
        return { ...prev, tasks: newTasks };
      });

      return newTask;
    } catch (error) {
      console.error('Failed to add task:', error);
      setError('Failed to add task');
      throw error;
    }
  }, [user, appwriteTaskToTask, setError]);

  // Update task
  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    if (!user) return;

    try {
      setError(null);
      
      const appwriteUpdates: any = {
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.priority !== undefined && { priority: updates.priority }),
        ...(updates.completed !== undefined && { completed: updates.completed }),
        ...(updates.dueDate !== undefined && { dueDate: updates.dueDate }),
        ...(updates.focusSeconds !== undefined && { focusSeconds: updates.focusSeconds }),
      };

      const updatedAppwriteTask = await taskService.updateTask(id, appwriteUpdates);
      const updatedTask = appwriteTaskToTask(updatedAppwriteTask);

      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(task => task.id === id ? updatedTask : task)
      }));

      return updatedTask;
    } catch (error) {
      console.error('Failed to update task:', error);
      setError('Failed to update task');
      throw error;
    }
  }, [user, appwriteTaskToTask, setError]);

  // Delete task
  const deleteTask = useCallback(async (id: string) => {
    if (!user) return;

    try {
      setError(null);
      await taskService.deleteTask(id);

      setState(prev => ({
        ...prev,
        tasks: prev.tasks.filter(task => task.id !== id)
      }));
    } catch (error) {
      console.error('Failed to delete task:', error);
      setError('Failed to delete task');
      throw error;
    }
  }, [user, setError]);

  // Bulk operations
  const toggleTasksCompletion = useCallback(async (ids: string[], completed: boolean) => {
    if (!user || ids.length === 0) return;

    try {
      setError(null);
      await Promise.all(
        ids.map(id => taskService.updateTask(id, { completed }))
      );

      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(task => 
          ids.includes(task.id) ? { ...task, completed } : task
        )
      }));
    } catch (error) {
      console.error('Failed to toggle tasks completion:', error);
      setError('Failed to update tasks');
      throw error;
    }
  }, [user, setError]);

  const deleteCompletedTasks = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);
      const completedTasks = state.tasks.filter(task => task.completed);
      
      await Promise.all(
        completedTasks.map(task => taskService.deleteTask(task.id))
      );

      setState(prev => ({
        ...prev,
        tasks: prev.tasks.filter(task => !task.completed)
      }));
    } catch (error) {
      console.error('Failed to delete completed tasks:', error);
      setError('Failed to delete completed tasks');
      throw error;
    }
  }, [user, state.tasks, setError]);

  // Computed values
  const taskStats = useMemo(() => {
    const total = state.tasks.length;
    const completed = state.tasks.filter(task => task.completed).length;
    const pending = total - completed;
    
    return { total, completed, pending };
  }, [state.tasks]);

  const filteredTasks = useCallback((
    searchTerm: string = '',
    priority: TaskPriority | 'all' = 'all',
    status: 'all' | 'completed' | 'pending' = 'all'
  ) => {
    return state.tasks.filter(task => {
      const matchesSearch = !searchTerm || 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesPriority = priority === 'all' || task.priority === priority;
      
      const matchesStatus = status === 'all' || 
        (status === 'completed' && task.completed) ||
        (status === 'pending' && !task.completed);
      
      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [state.tasks]);

  // Load tasks when user changes
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  return {
    // State
    tasks: state.tasks,
    loading: state.loading,
    error: state.error,
    
    // Actions
    loadTasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTasksCompletion,
    deleteCompletedTasks,
    
    // Computed
    taskStats,
    filteredTasks,
    
    // Utils
    setError,
  };
}

export default useAppwriteTasks;
