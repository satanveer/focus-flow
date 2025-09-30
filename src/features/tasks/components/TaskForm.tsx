import React, { useState } from 'react';
import { useAppwriteTasksContext } from '../AppwriteTasksContext';
import type { TaskPriority } from '../../../domain/models';

const priorities: TaskPriority[] = ['low', 'medium', 'high'];

export const TaskForm: React.FC = () => {
  const { addTask } = useAppwriteTasksContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [tags, setTags] = useState('');
  const [dueDate, setDueDate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
    // Simple duplicate prevention (same title case-insensitive not completed)
    // Could move to hook if needed for reuse
    addTask({ title: trimmed, description: description.trim(), priority, tags: tagList, dueDate: dueDate ? new Date(dueDate) : undefined });
    setTitle('');
    setDescription('');
    setPriority('medium');
    setTags('');
    setDueDate('');
    setError(null);
  }

  function validateDueDate(val: string) {
    setDueDate(val);
    if (val) {
      const today = new Date();
      today.setHours(0,0,0,0);
      const d = new Date(val);
      if (d < today) setError('Due date is in the past'); else setError(null);
    } else {
      setError(null);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card ff-stack">
      <div className="field">
        <label htmlFor="task-title">Title</label>
        <input id="task-title" placeholder="e.g. Plan sprint review" value={title} onChange={e => setTitle(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="task-desc">Description</label>
        <textarea id="task-desc" placeholder="Optional context" rows={3} value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      <div className="ff-stack" style={{gap:'.75rem'}}>
        <div className="field" style={{width:'100%'}}>
          <label htmlFor="task-priority">Priority</label>
          <select id="task-priority" value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} style={{width:'100%'}}>
            {priorities.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="field" style={{width:'100%'}}>
          <label htmlFor="task-due">Due date</label>
          <div className="ff-stack" style={{gap:'.35rem'}}>
            <div className="date-input">
              <span className="icon" aria-hidden="true">📅</span>
              <input id="task-due" type="date" value={dueDate} onChange={e => validateDueDate(e.target.value)} style={{width:'100%'}} />
            </div>
            <div className="ff-row" style={{gap:'.4rem', flexWrap:'wrap', justifyContent:'center'}}>
              <QuickDateButton label="Today" onSelect={() => {
                const d = new Date();
                const iso = d.toISOString().slice(0,10);
                validateDueDate(iso);
              }} active={(() => { const d=new Date(); return dueDate === d.toISOString().slice(0,10); })()} />
              <QuickDateButton label="Tomorrow" onSelect={() => {
                const d = new Date(); d.setDate(d.getDate()+1);
                const iso = d.toISOString().slice(0,10);
                validateDueDate(iso);
              }} active={(() => { const t=new Date(); t.setDate(t.getDate()+1); return dueDate === t.toISOString().slice(0,10); })()} />
              {dueDate && (
                <QuickDateButton label="Clear" onSelect={() => validateDueDate('')} variant="clear" />
              )}
            </div>
          </div>
        </div>
        <div className="field" style={{width:'100%'}}>
          <label htmlFor="task-tags">Tags</label>
          <input id="task-tags" placeholder="comma,separated" value={tags} onChange={e => setTags(e.target.value)} style={{width:'100%'}} />
        </div>
      </div>
      {error && <div className="inline-error">{error}</div>}
      <div className="ff-row" style={{justifyContent:'flex-end'}}>
        <button type="submit" className="btn primary" disabled={!title.trim()}>Add Task</button>
      </div>
    </form>
  );
};

interface QuickDateButtonProps {
  label: string;
  onSelect: () => void;
  active?: boolean;
  variant?: 'clear';
}

const QuickDateButton: React.FC<QuickDateButtonProps> = ({ label, onSelect, active, variant }) => {
  const base: React.CSSProperties = {
    fontSize: '.55rem',
    padding: '.35rem .5rem',
    borderRadius: '6px',
    lineHeight: 1,
    fontWeight: 600,
    letterSpacing: '.05em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    background: 'var(--bg-alt)',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '.25rem',
    transition: 'background .2s, color .2s, border-color .2s'
  };
  let style = { ...base } as React.CSSProperties;
  if (active) {
    style.background = 'linear-gradient(135deg,var(--accent) 0%,var(--accent-accent3) 100%)';
    style.color = '#fff';
    style.borderColor = 'var(--accent)';
  } else if (variant === 'clear') {
    style.background = 'transparent';
    style.color = 'var(--text-muted)';
    style.borderStyle = 'dashed';
  }
  return (
    <button
      type="button"
      aria-pressed={active || undefined}
      onClick={onSelect}
      style={style}
    >
      {label}
    </button>
  );
};
