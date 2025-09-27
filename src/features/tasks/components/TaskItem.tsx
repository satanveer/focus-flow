import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Task } from '../../../domain/models';
import { useTasksContext } from '../TasksContext';
import { usePomodoro } from '../../pomodoro/PomodoroContext';
import { Link } from 'react-router-dom';
import { useNotes } from '../../notes/NotesContext';

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
  const { createNote, notes, updateNote } = useNotes();
  const [showNote, setShowNote] = useState(false);
  const popRef = useRef<HTMLDivElement|null>(null);
  const existingLinked = notes.find(n => n.taskId === task.id);
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);

  const focusSessions = useMemo(() => sessions.filter(s => s.taskId === task.id && s.mode==='focus' && s.endedAt).sort((a,b)=> new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()), [sessions, task.id]);
  const totalMinutes = useMemo(()=> Math.round(focusSessions.reduce((a,b)=> a + b.durationSec, 0)/60), [focusSessions]);
  // Centered modal behaviors: esc close, focus trap, body scroll lock, focus restore
  useEffect(()=> {
    if(!showNote) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    function onKey(e: KeyboardEvent){
      if(e.key === 'Escape'){ e.preventDefault(); setShowNote(false); }
      if(e.key === 'Tab' && popRef.current){
        const focusables = popRef.current.querySelectorAll<HTMLElement>(
          'button, [href], textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if(focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length -1];
        if(e.shiftKey){
          if(document.activeElement === first){
            e.preventDefault();
            (last as HTMLElement).focus();
          }
        } else {
          if(document.activeElement === last){
            e.preventDefault();
            (first as HTMLElement).focus();
          }
        }
      }
    }
    document.addEventListener('keydown', onKey);
    // lock scroll
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return ()=> {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = origOverflow;
      if(previouslyFocused) previouslyFocused.focus(); else anchorRef.current?.focus();
    };
  }, [showNote]);

  return (
    <li className="task-item" style={{position:'relative'}}>
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
        <button ref={anchorRef} className="btn subtle" aria-label={existingLinked? 'Open note for task':'Add note for task'} onClick={()=> {
          if(!existingLinked){
            createNote(task.title, null, '', task.id);
          }
          setShowNote(s=> !s);
        }}>{existingLinked? 'Note':'Add Note'}</button>
        <button className="btn outline" onClick={() => removeTask(task.id)} aria-label="Delete task">Del</button>
      </div>
      {showNote && createPortal((
        <div
          role="presentation"
          aria-hidden={false}
          style={{position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center'}}
        >
          <div
            onMouseDown={e=> { if(e.target === e.currentTarget) setShowNote(false); }}
            style={{position:'absolute', inset:0, background:'rgba(0,0,0,.45)', backdropFilter:'blur(4px)'}}
            data-backdrop
          />
          <div
            ref={popRef}
            className="card"
            role="dialog"
            aria-modal="true"
            aria-label={`Note for task ${task.title}`}
            style={{
              position:'relative',
              width:'min(480px, 92vw)',
              maxHeight:'min(75vh, 600px)',
              display:'flex',
              flexDirection:'column',
              padding:'.85rem .95rem 1rem',
              boxShadow:'0 10px 40px -4px rgba(0,0,0,.6), 0 2px 14px -2px rgba(0,0,0,.55)',
              overflow:'hidden',
              animation:'fadeScale .18s ease',
            }}
          >
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'.6rem'}}>
              <strong style={{fontSize:'.7rem', letterSpacing:'.12em'}}>NOTE – {task.title}</strong>
              <div className="ff-row" style={{gap:'.35rem'}}>
                <button className="btn subtle" style={{fontSize:'.55rem'}} onClick={()=> setShowNote(false)} aria-label="Close note editor">✕</button>
              </div>
            </div>
            {(() => {
              const note = notes.find(n => n.taskId === task.id);
              if(!note) return <div style={{fontSize:'.55rem'}}>Creating...</div>;
              return (
                <textarea
                  value={note.body}
                  onChange={e=> updateNote(note.id,{body:e.target.value})}
                  aria-label="Note body"
                  style={{width:'100%', flexGrow:1, minHeight:'14rem', fontSize:'.7rem', fontFamily:'inherit', resize:'vertical', lineHeight:1.4}}
                  placeholder="Write your notes for this task here..."
                  autoFocus
                />
              );
            })()}
            <div style={{display:'flex', justifyContent:'flex-end', marginTop:'.55rem'}}>
              <button className="btn outline" style={{fontSize:'.6rem'}} onClick={()=> setShowNote(false)}>Done</button>
            </div>
          </div>
        </div>
      ), document.body)}
    </li>
  );
};
