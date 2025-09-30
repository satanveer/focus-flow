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
      <form onSubmit={handleSubmit} className="ff-stack" style={{gap:'1rem'}}>
        <h2 style={{fontSize:'.8rem', fontWeight:600}}>Add New Task</h2>
        
        {(error || contextError) && (
          <div style={{ 
            padding: '0.5rem', 
            backgroundColor: 'var(--error-bg)', 
            color: 'var(--error)', 
            borderRadius: '4px',
            fontSize: '0.75rem'
          }}>
            {error || contextError}
          </div>
        )}
        
        <div className="ff-stack" style={{gap:'.7rem'}}>
          <div>
            <label htmlFor="task-title" style={{fontSize:'.7rem', fontWeight:500}}>Title *</label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              style={{width:'100%', marginTop:'.25rem'}}
              disabled={submitting}
              required
            />
          </div>
          
          <div>
            <label htmlFor="task-desc" style={{fontSize:'.7rem', fontWeight:500}}>Description</label>
            <textarea
              id="task-desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional details..."
              rows={2}
              style={{width:'100%', marginTop:'.25rem', resize:'vertical'}}
              disabled={submitting}
            />
          </div>
          
          <div className="ff-row" style={{gap:'1rem', alignItems:'end', flexWrap:'wrap'}}>
            <div style={{minWidth:'6rem', flex:'0 0 auto'}}>
              <label htmlFor="task-priority" style={{fontSize:'.7rem', fontWeight:500}}>Priority</label>
              <select
                id="task-priority"
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                style={{width:'100%', marginTop:'.25rem'}}
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
            
            <div style={{minWidth:'10rem', flex:'1 1 auto'}}>
              <label htmlFor="task-due" style={{fontSize:'.7rem', fontWeight:500}}>Due Date</label>
              <div className="date-input" style={{marginTop:'.25rem'}}>
                <span className="icon" aria-hidden="true">📅</span>
                <input
                  id="task-due"
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  style={{width:'100%'}}
                  disabled={submitting}
                />
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="task-tags" style={{fontSize:'.7rem', fontWeight:500}}>Tags</label>
            <input
              id="task-tags"
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="work, urgent, project-x (comma separated)"
              style={{width:'100%', marginTop:'.25rem'}}
              disabled={submitting}
            />
          </div>
        </div>
        
        <div className="ff-row" style={{gap:'.5rem', justifyContent:'flex-end'}}>
          <button
            type="submit"
            className="btn primary"
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