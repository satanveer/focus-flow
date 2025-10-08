import React, { useState } from 'react';
import { useAppwriteTasksContext } from '../AppwriteTasksContext';
import type { TaskPriority } from '../../../domain/models';

const priorities: TaskPriority[] = ['low', 'medium', 'high'];

export const AppwriteTaskForm: React.FC = () => {
  const { addTask, loading, error: contextError } = useAppwriteTasksContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [tags, setTags] = useState('');
  const [dueDate, setDueDate] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      await addTask({ 
        title: trimmed, 
        description: description.trim(), 
        priority, 
        tags: tagList, 
        dueDate: dueDate ? new Date(dueDate) : undefined 
      });
      
      // Clear form on success
      setTitle('');
      setDescription('');
      setPriority('medium');
      setTags('');
      setDueDate('');
    } catch (err: any) {
      setError(err.message || 'Failed to add task');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card">
      <form onSubmit={handleSubmit} className="ff-stack gap-2 sm:gap-4">
        <h2 className="text-[0.7rem] sm:text-sm font-semibold">Add New Task</h2>
        
        {(error || contextError) && (
          <div className="p-1.5 text-[0.65rem] sm:text-sm rounded" style={{ 
            backgroundColor: 'var(--error-bg)', 
            color: 'var(--error)'
          }}>
            {error || contextError}
          </div>
        )}
        
        <div className="ff-stack gap-2 sm:gap-3">
          <div>
            <label htmlFor="task-title" className="text-[0.6rem] sm:text-[0.7rem] font-medium">Title *</label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full mt-0.5 sm:mt-1"
              disabled={submitting}
              required
            />
          </div>
          
          <div>
            <label htmlFor="task-desc" className="text-[0.6rem] sm:text-[0.7rem] font-medium">Description</label>
            <textarea
              id="task-desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional details..."
              rows={2}
              className="w-full mt-0.5 sm:mt-1 resize-vertical"
              disabled={submitting}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-end">
            <div className="min-w-0 flex-1 sm:flex-none sm:min-w-24">
              <label htmlFor="task-priority" className="text-[0.6rem] sm:text-[0.7rem] font-medium">Priority</label>
              <select
                id="task-priority"
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                className="w-full mt-0.5 sm:mt-1"
                disabled={submitting}
              >
                {priorities.map(p => {
                  const displayName = p === 'low' ? 'Low' : p === 'medium' ? 'Med' : 'High';
                  return (
                    <option key={p} value={p}>{displayName}</option>
                  );
                })}
              </select>
            </div>
            
            <div className="min-w-0 flex-1">
              <label htmlFor="task-due" className="text-[0.6rem] sm:text-[0.7rem] font-medium">Due Date</label>
              <div className="date-input mt-0.5 sm:mt-1">
                <span className="icon" aria-hidden="true">📅</span>
                <input
                  id="task-due"
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full"
                  disabled={submitting}
                />
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="task-tags" className="text-[0.6rem] sm:text-[0.7rem] font-medium">Tags</label>
            <input
              id="task-tags"
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="work, urgent"
              className="w-full mt-0.5 sm:mt-1"
              disabled={submitting}
            />
          </div>
        </div>
        
        <div className="ff-row gap-1.5 sm:gap-2 justify-end">
          <button
            type="submit"
            className="btn primary text-[0.65rem] sm:text-sm"
            disabled={!title.trim() || submitting || loading}
            style={{opacity: submitting ? 0.7 : 1}}
          >
            {submitting ? 'Adding...' : 'Add Task'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AppwriteTaskForm;