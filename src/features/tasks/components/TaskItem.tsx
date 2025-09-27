import React, { useState, useMemo } from 'react';
import type { Task } from '../../../domain/models';
import { useTasksContext } from '../TasksContext';
import { usePomodoro } from '../../pomodoro/PomodoroContext';
import { Link } from 'react-router-dom';

function tagColor(tag: string) {
  // Simple hash to h(0-359)
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) % 360;
  return `hsl(${h} 70% 45%)`;
}

interface Props { task: Task; }

function dueInfo(task: Task) {
  if (!task.dueDate) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const due = new Date(task.dueDate); due.setHours(0,0,0,0);
  const diff = due.getTime() - today.getTime();
  const oneDay = 86400000;
  if (diff < 0) return <span className="due-chip overdue">Overdue</span>;
  if (diff === 0) return <span className="due-chip today">Today</span>;
  if (diff === oneDay) return <span className="due-chip">Tomorrow</span>;
  return <span className="due-chip">Due {due.toLocaleDateString()}</span>;
}

export const TaskItem: React.FC<Props> = ({ task }) => {
  const { toggleTask, removeTask } = useTasksContext();
  const { sessions } = usePomodoro();
  const [open, setOpen] = useState(false);

  const focusSessions = useMemo(() => sessions.filter(s => s.taskId === task.id && s.mode==='focus' && s.endedAt).sort((a,b)=> new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()), [sessions, task.id]);
  const totalMinutes = useMemo(()=> Math.round(focusSessions.reduce((a,b)=> a + b.durationSec, 0)/60), [focusSessions]);
  return (
    <li className="task-item">
      <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} aria-label="Toggle complete" />
      <div>
        <div className="task-title-wrapper">
          <button onClick={()=> setOpen(o=> !o)} className="task-title" style={{all:'unset', cursor:'pointer', fontWeight: task.completed ? 400:600, textDecoration: task.completed ? 'line-through':'none'}} aria-expanded={open} aria-controls={`task-focus-${task.id}`} aria-label={`${open? 'Collapse':'Expand'} focus history for task ${task.title}`}>
            {task.title}
          </button>{' '}
          <span className={`badge dot priority-${task.priority}`}>{task.priority}</span>
        </div>
        {task.description && <div className="task-desc">{task.description}</div>}
        <div className="task-meta">
          {dueInfo(task)}
          {task.tags.map(tag => <span key={tag} className="tag" style={{background:`hsl(${(tagColor(tag).match(/\d+/)||['0'])[0]} 70% 18%)`, borderColor: tagColor(tag), color: tagColor(tag)}}>{tag}</span>)}
          {typeof task.focusSeconds === 'number' && task.focusSeconds > 0 && (
            <span className="tag" style={{background:'var(--accent-accent2)', borderColor:'var(--accent-accent3)', color:'#fff'}} aria-label={`Focused ${Math.round(task.focusSeconds/60)} minutes total on this task`}>
              <span aria-hidden="true">⏱ {Math.round(task.focusSeconds/60)}m</span>
            </span>
          )}
        </div>
        {open && (
          <div id={`task-focus-${task.id}`} className="ff-stack" style={{gap:'.4rem', marginTop:'.5rem'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <span style={{fontSize:'.6rem', letterSpacing:'.1em', textTransform:'uppercase', color:'var(--text-muted)'}}>Focus History</span>
              <span style={{fontSize:'.55rem', color:'var(--text-muted)'}}>{totalMinutes}m total</span>
            </div>
            {focusSessions.length === 0 && (
              <div style={{fontSize:'.55rem', color:'var(--text-muted)'}}>No focus sessions yet.</div>
            )}
            {focusSessions.length > 0 && (
              <ul style={{listStyle:'none', margin:0, padding:0, display:'flex', flexDirection:'column', gap:'.25rem', maxHeight:'8rem', overflowY:'auto'}}>
                {focusSessions.slice(0,15).map(s => {
                  const mins = Math.round(s.durationSec/60);
                  const start = new Date(s.startedAt);
                  return (
                    <li key={s.id} style={{display:'flex', gap:'.5rem', fontSize:'.55rem', alignItems:'center'}}>
                      <span style={{color:'var(--text-primary)'}}>{mins}m</span>
                      <span style={{color:'var(--text-muted)'}}>{start.toLocaleDateString(undefined,{month:'short', day:'numeric'})} {start.toLocaleTimeString(undefined,{hour:'2-digit', minute:'2-digit'})}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
      <div className="ff-row" style={{alignSelf:'flex-start', gap:'.3rem'}}>
        <Link to={`/timer?taskId=${task.id}&autoStart=1`} className="btn primary" aria-label="Focus with Pomodoro">Focus</Link>
        <button className="btn outline" onClick={() => removeTask(task.id)} aria-label="Delete task">Del</button>
      </div>
    </li>
  );
};
