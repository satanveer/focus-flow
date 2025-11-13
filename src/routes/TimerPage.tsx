import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { usePomodoro } from '../features/pomodoro/PomodoroContext';
import FocusGoalBar from '../features/pomodoro/components/FocusGoalBar';
import { useAppwriteTasksContext } from '../features/tasks/AppwriteTasksContext';
import { useSearchParams } from 'react-router-dom';
import { useAppwriteNotes } from '../features/notes/AppwriteNotesContext';
import type { ProductivityRating } from '../domain/models';

function format(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2,'0');
  const s = Math.floor(seconds % 60).toString().padStart(2,'0');
  return `${m}:${s}`;
}

export default function TimerPage() {
  const { start, pause, resume, abort, complete, active, getRemaining, focusDurations, sessions, updateSessionProductivity } = usePomodoro() as any;
  const { tasks } = useAppwriteTasksContext();
  const { notes, createNote, updateNote } = useAppwriteNotes();
  // Reflection prompt state
  const [pendingReflection, setPendingReflection] = useState<{taskId: string; sessionId: string} | null>(null);
  const seenSessionIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef(true);

  // Only prompt for newly completed focus sessions with a task AFTER initial mount.
  useEffect(()=> {
    if(initialLoadRef.current){
      // Mark all existing sessions as already seen to suppress prompt on page navigation.
  sessions.forEach((s: any) => seenSessionIdsRef.current.add(s.id));
      initialLoadRef.current = false;
      return;
    }
    if(!sessions.length) return;
    const newest = sessions[sessions.length - 1];
    if(seenSessionIdsRef.current.has(newest.id)) return;
    seenSessionIdsRef.current.add(newest.id);
    if(newest.mode==='focus' && newest.taskId){
      setPendingReflection({taskId: newest.taskId, sessionId: newest.id});
    }
  }, [sessions]);
  const [remaining, setRemaining] = useState(getRemaining());
  const [params] = useSearchParams();
  const taskIdParam = params.get('taskId') || undefined;
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(taskIdParam);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [panelNoteId, setPanelNoteId] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setRemaining(getRemaining()), 500);
    return () => clearInterval(id);
  }, [getRemaining]);

  // Auto start when arriving with autoStart=1 and no active session (only on initial mount)
  const hasAutoStartedRef = useRef(false);
  useEffect(() => {
    const auto = params.get('autoStart');
    if (auto && !active && !hasAutoStartedRef.current) {
      hasAutoStartedRef.current = true;
      start({ mode: 'focus', taskId: taskIdParam });
    }
  }, [params, active, start, taskIdParam]);

  const mode = active?.mode || 'focus';
  const totalForMode = useMemo(() => {
    if (active) return active.durationSec;
    // fallback planned duration for default mode (focus) when idle
    if (mode === 'focus') return focusDurations.focus;
    if (mode === 'shortBreak') return focusDurations.shortBreak;
    return focusDurations.longBreak;
  }, [active, mode, focusDurations]);
  const pct = totalForMode === 0 ? 0 : Math.min(100, Math.max(0, ((totalForMode - remaining) / totalForMode) * 100));
  const ring = {
    size: 200,
    stroke: 10
  };
  const radius = (ring.size - ring.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (pct / 100) * circumference;
  const strokeColor = mode === 'focus' ? 'var(--accent)' : mode === 'shortBreak' ? 'var(--warning)' : 'var(--info)';
  const isRunning = !!active && !active.paused;
  const isPaused = !!active && active.paused;

  const customInputRef = useRef<HTMLInputElement | null>(null);
  const announcerRef = useRef<HTMLDivElement | null>(null);

  // Keyboard shortcuts
  const keyHandler = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') return; // allow global shortcuts
    if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return; // ignore when typing
    switch (e.key.toLowerCase()) {
      case 'f': if (!active) start({ mode: 'focus', taskId: selectedTaskId }); break;
      case 's': if (!active) start({ mode: 'shortBreak', taskId: selectedTaskId }); break;
      case 'l': if (!active) start({ mode: 'longBreak', taskId: selectedTaskId }); break;
      case ' ': if (active) { e.preventDefault(); active.paused ? resume() : pause(); } break;
      case 'escape': if (active) abort(); break;
    }
  }, [active, abort, pause, resume, start, selectedTaskId]);

  useEffect(() => {
    window.addEventListener('keydown', keyHandler);
    return () => window.removeEventListener('keydown', keyHandler);
  }, [keyHandler]);

  // Announce session changes for accessibility
  const prevSessionId = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (active && prevSessionId.current !== active.sessionId) {
      prevSessionId.current = active.sessionId;
      announcerRef.current && (announcerRef.current.textContent = `${active.mode} session started for ${Math.round(active.durationSec/60)} minutes`);
    } else if (!active && prevSessionId.current) {
      announcerRef.current && (announcerRef.current.textContent = 'Session ended');
      prevSessionId.current = undefined;
    }
  }, [active]);

  // Determine current task for note binding (active takes precedence else selected)
  const currentTaskId = active?.taskId || selectedTaskId;
  const existingNote = useMemo(()=> currentTaskId ? notes.find(n=> n.taskId===currentTaskId) : undefined, [notes, currentTaskId]);

  // Ensure note exists when opening panel
  useEffect(()=> {
    if(showNotesPanel && currentTaskId){
      if(!existingNote){
        const task = tasks.find(t=> t.id===currentTaskId);
        if(task){
          createNote(task.title, null, '', currentTaskId).then(newN => {
            setPanelNoteId(newN.id);
          }).catch(err => {
            console.error('Failed to create note:', err);
          });
        }
      } else {
        setPanelNoteId(existingNote.id);
      }
    }
  }, [showNotesPanel, currentTaskId, existingNote, createNote, tasks]);

  // Persist panel state across task switches (keep open) and after session end.
  useEffect(()=> {
    if(!currentTaskId){
      // if no task selected keep panel but blank
      setPanelNoteId(existingNote? existingNote.id : null);
    }
  }, [currentTaskId, existingNote]);

  // Handler for updating notes asynchronously
  const handleUpdateNote = useCallback(async (noteId: string, patch: Partial<{title: string; body: string}>) => {
    try {
      await updateNote(noteId, patch);
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  }, [updateNote]);

  // Filter out completed tasks for timer selection
  const activeTasks = useMemo(() => tasks.filter(t => !t.completed), [tasks]);

  return (
  <div className="ff-stack" style={{gap:'1.5rem', position:'relative'}}>
      <FocusGoalBar />
  <div className="card ff-stack" style={{alignItems:'center', textAlign:'center', gap:'1.5rem', padding:'2.5rem 1.5rem'}} role="region" aria-label="Pomodoro timer controls">
        <div className="ff-row" style={{gap:'.5rem', flexWrap:'wrap', justifyContent:'center'}}>
          <select
            value={selectedTaskId || ''}
            onChange={e => setSelectedTaskId(e.target.value || undefined)}
            className="text-xs px-2 py-1 rounded border border-[var(--border)] bg-[var(--bg)]"
            style={{minWidth:'12rem'}}
          >
            <option value="">(No task)</option>
            {activeTasks.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
          {selectedTaskId && (
            <>
              <button type="button" className="btn subtle" onClick={() => setSelectedTaskId(undefined)} style={{fontSize:'.6rem'}}>×</button>
              <button type="button" className="btn subtle" style={{fontSize:'.6rem'}} onClick={()=> setShowNotesPanel(s=> !s)} aria-expanded={showNotesPanel} aria-controls="timer-notes-panel">
                📝 Notes
              </button>
            </>
          )}
        </div>
        <div style={{display:'flex', gap:4, background:'var(--surface)', padding:4, border:'1px solid var(--border)', borderRadius:999}} aria-label="Mode selector">
          {(['focus','shortBreak','longBreak'] as const).map(m => (
            <button key={m} type="button" disabled={!!active && mode!==m} onClick={() => start({ mode: m, taskId: selectedTaskId })} className={m===mode? 'btn primary':'btn subtle'} style={{fontSize:'.6rem', padding:'.35rem .7rem', borderRadius:999}}>
              {m === 'focus' ? 'Focus' : m === 'shortBreak' ? 'Short' : 'Long'}
            </button>
          ))}
        </div>
  <div style={{position:'relative', width:ring.size, height:ring.size}} role="timer" aria-valuemin={0} aria-valuemax={totalForMode} aria-valuenow={totalForMode-remaining} aria-label={`${mode} session timer`}>
          <div style={{position:'absolute', inset:'-10%', filter:'blur(40px)', opacity: active?0.35:0.15, transition:'opacity .6s', background: `radial-gradient(circle at 50% 50%, ${strokeColor}55, transparent 70%)`}} aria-hidden="true" />
          <svg width={ring.size} height={ring.size} style={{display:'block'}}>
            <circle
              cx={ring.size/2}
              cy={ring.size/2}
              r={radius}
              stroke="var(--surface-2)"
              strokeWidth={ring.stroke}
              fill="none"
            />
            <circle
              cx={ring.size/2}
              cy={ring.size/2}
              r={radius}
              stroke={strokeColor}
              strokeWidth={ring.stroke}
              fill="none"
              strokeDasharray={`${dash} ${circumference-dash}`}
              strokeLinecap="round"
              style={{transition:'stroke-dasharray .5s linear'}}
              transform={`rotate(-90 ${ring.size/2} ${ring.size/2})`}
            />
          </svg>
          <div style={{position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0 .5rem', textAlign:'center'}}>
            <div style={{fontSize:'clamp(1.7rem,5.5vw,3rem)', fontWeight:600, letterSpacing:'.05em', fontVariantNumeric:'tabular-nums', lineHeight:1}} aria-live="off">{format(remaining)}</div>
            <div style={{fontSize:'.55rem', textTransform:'uppercase', letterSpacing:'.15em', color:'var(--text-muted)', marginTop:'.25rem'}}>{mode === 'focus' ? 'Focus' : mode === 'shortBreak' ? 'Break' : 'Long Break'}</div>
          </div>
        </div>
        <div className="ff-row" style={{gap:'.75rem', flexWrap:'wrap', justifyContent:'center'}}>
          {!active && (
            <button type="button" className="btn primary" onClick={() => start({ mode:'focus', taskId: selectedTaskId })} aria-label="Start focus session" style={{fontSize:'.7rem', padding:'.5rem 1.2rem'}}>Start</button>
          )}
          {isRunning && (
            <button type="button" className="btn" onClick={pause} aria-label="Pause timer" style={{fontSize:'.7rem', padding:'.5rem 1.2rem'}}>Pause</button>
          )}
          {isPaused && (
            <button type="button" className="btn primary" onClick={resume} aria-label="Resume timer" style={{fontSize:'.7rem', padding:'.5rem 1.2rem'}}>Resume</button>
          )}
          {!!active && (
            <>
              <button
                type="button"
                className="btn subtle"
                onClick={() => {
                  complete();
                  setRemaining(0);
                }}
                aria-label="Complete session early"
                style={{fontSize:'.65rem'}}
              >Complete</button>
              <button type="button" className="btn danger" onClick={abort} aria-label="Abort session" style={{fontSize:'.65rem'}}>Abort</button>
            </>
          )}
        </div>
        <div className="card" style={{width:'100%', maxWidth:520, padding:'.9rem 1rem', background:'var(--surface-1)', border:'1px solid var(--border)'}}>
          <div style={{display:'flex', alignItems:'center', gap:'.5rem', justifyContent:'center', flexWrap:'wrap'}}>
            <select
              onChange={(e) => {
                const val = e.target.value;
                if (val && customInputRef.current) {
                  customInputRef.current.value = val;
                  if (val !== 'custom') {
                    start({mode:'focus', taskId:selectedTaskId, durationSec: Number(val)*60});
                  }
                }
              }}
              disabled={!!active}
              style={{
                fontSize:'.65rem', 
                padding:'.45rem .7rem', 
                border:'1px solid var(--border)', 
                borderRadius:'var(--radius-md)', 
                background:'var(--surface-2)',
                minWidth:'7rem'
              }}
              defaultValue=""
            >
              <option value="">Quick Start</option>
              <option value="15">15 min</option>
              <option value="25">25 min</option>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </select>
            <span style={{fontSize:'.6rem', color:'var(--text-muted)'}}>or</span>
            <input
              ref={customInputRef}
              placeholder="MINUTES"
              type="number"
              min={1}
              className="focus-mins-input"
              style={{width:'6rem', textAlign:'center', fontSize:'.65rem', padding:'.45rem .7rem', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', background:'var(--surface-2)', WebkitAppearance:'none'}}
              disabled={!!active}
              onKeyDown={e=>{ if(e.key==='Enter'){ const val=Number((e.target as HTMLInputElement).value); if(val>0) start({mode:'focus', taskId:selectedTaskId, durationSec: val*60}); } }}
            />
            <button type="button" className="btn primary" style={{fontSize:'.65rem', padding:'.45rem .8rem'}} disabled={!!active} onClick={()=>{ const val=Number(customInputRef.current?.value||0); if(val>0) start({mode:'focus', taskId:selectedTaskId, durationSec: val*60}); }}>Start</button>
          </div>
        </div>
      </div>
      {pendingReflection && (
        <div style={{position:'fixed', inset:0, zIndex:1200, display:'flex', alignItems:'center', justifyContent:'center'}} role="dialog" aria-modal="true" aria-label="Session reflection">
          <div onMouseDown={e=> { if(e.target===e.currentTarget) setPendingReflection(null); }} style={{position:'absolute', inset:0, backdropFilter:'blur(2px)', background:'rgba(0,0,0,.35)'}} />
          <div className="card ff-stack" style={{position:'relative', width:'min(420px, 92vw)', padding:'1rem 1rem 1.25rem', gap:'.75rem', boxShadow:'0 10px 40px -6px rgba(0,0,0,.55)'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <strong style={{fontSize:'.75rem', letterSpacing:'.1em'}}>SESSION REFLECTION</strong>
              <button className="btn subtle" style={{fontSize:'.55rem'}} onClick={()=> setPendingReflection(null)} aria-label="Dismiss reflection">✕</button>
            </div>
            <p style={{fontSize:'.65rem', lineHeight:1.4, margin:0}}>How did that focus session go?</p>
            <div className="ff-stack" style={{gap:'.5rem'}}>
              {['Great focus','Some distractions','Unfocused'].map(label => (
                <button
                  key={label}
                  className="btn outline"
                  style={{justifyContent:'flex-start', fontSize:'.6rem'}}
                  onClick={()=> {
                    // Map the label to productivity rating
                    const ratingMap: Record<string, ProductivityRating> = {
                      'Great focus': 'great',
                      'Some distractions': 'some-distractions', 
                      'Unfocused': 'unfocused'
                    };
                    const rating = ratingMap[label];
                    
                    // Update the session's productivity rating
                    if (rating && pendingReflection?.sessionId) {
                      updateSessionProductivity(pendingReflection.sessionId, rating);
                    }
                    
                    // Handle note creation/update asynchronously
                    if(pendingReflection?.taskId){
                      (async () => {
                        try {
                          let note = notes.find(n=> n.taskId===pendingReflection.taskId);
                          if(!note){
                            const task = tasks.find(t=> t.id===pendingReflection.taskId);
                            if(task){ 
                              note = await createNote(task.title, null, '', pendingReflection.taskId);
                            }
                          }
                          if(note){
                            const now = new Date();
                            const datePart = now.toLocaleDateString(undefined,{year:'numeric', month:'short', day:'numeric'});
                            const timePart = now.toLocaleTimeString(undefined,{hour:'2-digit', minute:'2-digit'});
                            const emoji = label === 'Great focus' ? '🟢' : label === 'Some distractions' ? '🟡' : '🔴';
                            // New concise reflection line (EASY PARSE MARKER at start)
                            const line = `${emoji} ${label} — ${datePart} ${timePart}`;
                            const addition = (note.body.endsWith('\n') || note.body==='') ? line : `\n${line}`;
                            await updateNote(note.id, { body: note.body + addition });
                          }
                        } catch (error) {
                          console.error('Failed to update note:', error);
                        }
                      })();
                    }
                    setPendingReflection(null);
                  }}
                >{label}</button>
              ))}
            </div>
            <div style={{display:'flex', justifyContent:'flex-end'}}>
              <button className="btn subtle" style={{fontSize:'.55rem'}} onClick={()=> setPendingReflection(null)}>Skip</button>
            </div>
          </div>
        </div>
      )}
      {showNotesPanel && (
        <aside
          id="timer-notes-panel"
          className="card ff-stack"
          style={{position:'fixed', top:'4rem', right:'1rem', width:'min(380px, 90vw)', height:'min(70vh, 600px)', zIndex:900, padding:'.85rem .9rem 1rem', gap:'.55rem', boxShadow:'0 8px 28px -6px rgba(0,0,0,.55), 0 2px 10px -2px rgba(0,0,0,.5)', display:'flex'}}
          aria-label="Task notes panel"
          role="complementary"
        >
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <strong style={{fontSize:'.65rem', letterSpacing:'.1em'}}>NOTES</strong>
            <button className="btn subtle" style={{fontSize:'.55rem'}} onClick={()=> setShowNotesPanel(false)} aria-label="Close notes panel">✕</button>
          </div>
          {currentTaskId ? (
            panelNoteId ? (
              (()=> {
                const note = notes.find(n=> n.id===panelNoteId);
                if(!note) return <div style={{fontSize:'.55rem'}}>Loading note...</div>;
                return (
                  <div className="ff-stack" style={{gap:'.4rem', flexGrow:1}}>
                    <input
                      value={note.title}
                      onChange={e=> handleUpdateNote(note.id,{title:e.target.value})}
                      aria-label="Note title"
                      style={{fontSize:'.7rem', fontWeight:600, padding:'.35rem .45rem', border:'1px solid var(--border)', borderRadius:4, background:'var(--surface-1)'}}
                    />
                    <textarea
                      value={note.body}
                      onChange={e=> handleUpdateNote(note.id,{body:e.target.value})}
                      aria-label="Note body"
                      style={{flexGrow:1, resize:'vertical', minHeight:'8rem', fontSize:'.65rem', lineHeight:1.4, fontFamily:'inherit'}}
                      placeholder="Write your notes for this task..."
                    />
                  </div>
                );
              })()
            ) : (
              <div style={{fontSize:'.55rem'}}>Preparing note...</div>
            )
          ) : (
            <div style={{fontSize:'.55rem', color:'var(--text-muted)'}}>Select a task to attach a note.</div>
          )}
          {!currentTaskId && (
            <div style={{fontSize:'.5rem', color:'var(--text-muted)'}}>Use the task selector above to choose a task for notes.</div>
          )}
        </aside>
      )}
  <div ref={announcerRef} aria-live="polite" style={{position:'absolute', width:0, height:0, overflow:'hidden'}} />
      {/* Local keyframes for pulse (scoped via style tag) */}
      <style>{`@keyframes ff-pulse { 0%,100% { transform: scale(1); filter:brightness(1);} 50% { transform: scale(1.05); filter:brightness(1.25);} }`}</style>
    </div>
  );
}