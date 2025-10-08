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
    // IMPORTANT: Clear tasks immediately if no user
    if (!user || !isAuthenticated) {
      setTasks([]);
      setLoading(false);
      setError(null);
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
      setTasks([]); // Clear tasks on error too
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated, appwriteTaskToTask, setTasks, setLoading, setError]);

  // Add new task
  const addTask = useCallback(async (data: {
    title: string;
    description?: string;
    priority?: TaskPriority;
    tags?: string[];
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
        tags: data.tags || [],
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

  // Individual task actions
  const toggleTask = useCallback(async (id: string) => {
    const task = state.tasks.find(t => t.id === id);
    if (task) {
      await updateTask(id, { completed: !task.completed });
    }
  }, [state.tasks, updateTask]);

  const removeTask = useCallback(async (id: string) => {
    await deleteTask(id);
  }, [deleteTask]);

  // Filter functionality
  const [filters, setFilters] = useState({
    search: '',
    priorities: [] as TaskPriority[],
    status: 'all' as 'all' | 'completed' | 'pending',
    hideCompleted: false,
    tag: null as string | null,
    quickFilter: null as string | null
  });

  // Computed values
  const taskStats = useMemo(() => {
    const total = state.tasks.length;
    const completed = state.tasks.filter(task => task.completed).length;
    const pending = total - completed;
    const completionRate = total === 0 ? 0 : completed / total;
    const totalFocusSeconds = state.tasks.reduce((acc, t) => acc + (t.focusSeconds || 0), 0);
    
    return { total, completed, pending, completionRate, totalFocusSeconds };
  }, [state.tasks]);

  // Filtered tasks using current filters
  const getFilteredTasks = useCallback(() => {
    return state.tasks.filter(task => {
      const matchesSearch = !filters.search || 
        task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(filters.search.toLowerCase()));
      
      const matchesPriority = filters.priorities.length === 0 || filters.priorities.includes(task.priority);
      
      const matchesStatus = filters.status === 'all' || 
        (filters.status === 'completed' && task.completed) ||
        (filters.status === 'pending' && !task.completed);
      
      const matchesHideCompleted = !filters.hideCompleted || !task.completed;
      
      const matchesTag = !filters.tag || task.tags.includes(filters.tag);
      
      // Simple quickFilter implementation - you can customize this logic
      const matchesQuickFilter = !filters.quickFilter || 
        (filters.quickFilter === 'today' && task.dueDate && new Date(task.dueDate).toDateString() === new Date().toDateString()) ||
        (filters.quickFilter === 'overdue' && task.dueDate && new Date(task.dueDate) < new Date() && !task.completed) ||
        (filters.quickFilter === 'high' && task.priority === 'high');
      
      return matchesSearch && matchesPriority && matchesStatus && matchesHideCompleted && matchesTag && matchesQuickFilter;
    });
  }, [state.tasks, filters]);

  const filteredTasks = useMemo(() => getFilteredTasks(), [getFilteredTasks]);

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
    toggleTask,
    removeTask,
    toggleTasksCompletion,
    deleteCompletedTasks,
    clearCompleted: deleteCompletedTasks, // Alias for compatibility
    
    // Filters
    filters,
    setFilters,
    
    // Computed
    stats: taskStats,
    taskStats,
    filteredTasks,
    
    // Utils
    setError,
  };
}

export default useAppwriteTasks;
