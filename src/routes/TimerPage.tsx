import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { usePomodoro } from '../features/pomodoro/PomodoroContext';
import FocusGoalBar from '../features/pomodoro/components/FocusGoalBar';
import { useTasksContext } from '../features/tasks/TasksContext';
import { useSearchParams } from 'react-router-dom';

function format(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2,'0');
  const s = Math.floor(seconds % 60).toString().padStart(2,'0');
  return `${m}:${s}`;
}

export default function TimerPage() {
  const { start, pause, resume, abort, complete, active, getRemaining, focusDurations, updateDurations, autoStartNext, toggleAutoStart, sessions, focusCycleCount, creditMode, longBreakEvery, updateCreditMode, updateLongBreakEvery, enableSound, enableNotifications, toggleSound, toggleNotifications } = usePomodoro() as any;
  const { tasks } = useTasksContext();
  const [remaining, setRemaining] = useState(getRemaining());
  const [params] = useSearchParams();
  const taskIdParam = params.get('taskId') || undefined;
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(taskIdParam);

  useEffect(() => {
    const id = setInterval(() => setRemaining(getRemaining()), 500);
    return () => clearInterval(id);
  }, [getRemaining]);

  // Auto start when arriving with autoStart=1 and no active session
  useEffect(() => {
    const auto = params.get('autoStart');
    if (auto && !active) {
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
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  // Derived stats
  const elapsed = totalForMode - remaining;
  const elapsedPct = pct;
  const nextLongBreakIn = useMemo(() => {
    // every 4th focus is long; show how many more focus completions until long break
    const mod = focusCycleCount % 4; // 0 just after long break or at start
    const remainingToLong = (mod === 0 ? 4 : 4 - mod);
    return remainingToLong;
  }, [focusCycleCount]);

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

  return (
    <div className="ff-stack" style={{gap:'1.5rem'}}>
      <FocusGoalBar />
      <header className="ff-stack" style={{gap:'.25rem'}}>
        <h1 style={{fontSize:'1.3rem', fontWeight:600}}>Pomodoro</h1>
        {selectedTaskId && (
          <p style={{fontSize:'.75rem', color:'var(--text-muted)'}}>Focusing: <strong>{tasks.find(t=>t.id===selectedTaskId)?.title}</strong></p>
        )}
      </header>
      <div className="card ff-stack" style={{alignItems:'center', textAlign:'center', gap:'1rem', padding:'2.5rem 1.5rem'}}>
        <div className="ff-row" style={{gap:'.5rem', flexWrap:'wrap', justifyContent:'center'}}>
          <select
            value={selectedTaskId || ''}
            onChange={e => setSelectedTaskId(e.target.value || undefined)}
            className="text-xs px-2 py-1 rounded border border-[var(--border)] bg-[var(--bg)]"
            style={{minWidth:'12rem'}}
          >
            <option value="">(No task)</option>
            {tasks.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
          {selectedTaskId && (
            <button type="button" className="btn subtle" onClick={() => setSelectedTaskId(undefined)} style={{fontSize:'.6rem'}}>Clear</button>
          )}
        </div>
        <div style={{display:'flex', gap:'.5rem'}} aria-label="Mode selector">
          {(['focus','shortBreak','longBreak'] as const).map(m => (
            <button key={m} type="button" disabled={!!active && mode!==m} onClick={() => start({ mode: m, taskId: selectedTaskId })} className={m===mode? 'btn primary':'btn subtle'} style={{fontSize:'.6rem'}}>
              {m === 'focus' ? 'Focus' : m === 'shortBreak' ? 'Short Break' : 'Long Break'}
            </button>
          ))}
        </div>
        <div style={{position:'relative', width:ring.size, height:ring.size}}>
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
            <div style={{fontSize:'clamp(1.7rem,5.5vw,3rem)', fontWeight:600, letterSpacing:'.05em', fontVariantNumeric:'tabular-nums', lineHeight:1}}>{format(remaining)}</div>
            <div style={{fontSize:'.55rem', textTransform:'uppercase', letterSpacing:'.15em', color:'var(--text-muted)'}}>{mode === 'focus' ? 'Focus' : mode === 'shortBreak' ? 'Short Break' : 'Long Break'}</div>
          </div>
        </div>
        <div style={{fontSize:'.55rem', color:'var(--text-muted)', display:'flex', gap:'.7rem', flexWrap:'wrap', justifyContent:'center'}}>
          <span>Elapsed {format(elapsed)}</span>
          <span>Remaining {format(remaining)}</span>
          <span>{Math.round(elapsedPct)}%</span>
          {mode==='focus' && <span>Long break in {nextLongBreakIn} focus{nextLongBreakIn===1?'':'es'}</span>}
          <span style={{opacity:.65}}>Space: pause/resume • F/S/L: start mode • Esc: abort</span>
        </div>
        <div className="ff-row" style={{gap:'.75rem', flexWrap:'wrap', justifyContent:'center'}}>
          {!active && (
            <button type="button" className="btn primary" onClick={() => start({ mode:'focus', taskId: selectedTaskId })}>Start</button>
          )}
          {isRunning && (
            <button type="button" className="btn" onClick={pause}>Pause</button>
          )}
          {isPaused && (
            <button type="button" className="btn primary" onClick={resume}>Resume</button>
          )}
          {!!active && (
            <button
              type="button"
              className="btn subtle"
              onClick={() => {
                complete();
                setRemaining(0); // immediate visual reset per requirement
              }}
            >Complete</button>
          )}
          {!!active && (
            <button type="button" className="btn danger" onClick={abort}>Abort</button>
          )}
          {!active && (
            <button type="button" className="btn subtle" style={{fontSize:'.6rem'}} onClick={() => {
              // quick synthetic test: simulate a just-finished short focus session for side-effects
              try {
                // Use Notification API and audio helper indirectly by starting a 1s session and fast-forwarding
                start({ mode:'focus', taskId: selectedTaskId, durationSec: 2 });
                setTimeout(()=> complete(), 1200);
              } catch {}
            }}>Test Alert</button>
          )}
        </div>
        <form
          onSubmit={e => e.preventDefault()}
          className="ff-row"
          style={{gap:'1rem', flexWrap:'wrap', justifyContent:'center', fontSize:'.55rem', color:'var(--text-muted)'}}
        >
          <label style={{display:'flex', flexDirection:'column', alignItems:'flex-start', gap:'.15rem'}}>
            <span>Focus (m)</span>
            <input
              type="number"
              min={1}
              value={Math.round(focusDurations.focus/60)}
              onChange={e => updateDurations({ focus: Number(e.target.value) * 60 })}
              style={{width:'3.5rem'}}
            />
          </label>
          <label style={{display:'flex', flexDirection:'column', alignItems:'flex-start', gap:'.15rem'}}>
            <span>Short (m)</span>
            <input
              type="number"
              min={1}
              value={Math.round(focusDurations.shortBreak/60)}
              onChange={e => updateDurations({ shortBreak: Number(e.target.value) * 60 })}
              style={{width:'3.5rem'}}
            />
          </label>
            <label style={{display:'flex', flexDirection:'column', alignItems:'flex-start', gap:'.15rem'}}>
            <span>Long (m)</span>
            <input
              type="number"
              min={1}
              value={Math.round(focusDurations.longBreak/60)}
              onChange={e => updateDurations({ longBreak: Number(e.target.value) * 60 })}
              style={{width:'3.5rem'}}
            />
          </label>
          <label style={{display:'flex', alignItems:'center', gap:'.35rem', fontSize:'.6rem', cursor:'pointer'}}>
            <input type="checkbox" checked={autoStartNext} onChange={toggleAutoStart} /> Auto-start chain
          </label>
          <label style={{display:'flex', alignItems:'center', gap:'.35rem', fontSize:'.6rem', cursor:'pointer'}}>
            <input type="checkbox" checked={enableSound} onChange={toggleSound} /> Sound
          </label>
          <label style={{display:'flex', alignItems:'center', gap:'.35rem', fontSize:'.6rem', cursor:'pointer'}}>
            <input type="checkbox" checked={enableNotifications} onChange={toggleNotifications} /> Notify
          </label>
          <label style={{display:'flex', flexDirection:'column', alignItems:'flex-start', gap:'.15rem'}}>
            <span>Credit</span>
            <select value={creditMode} onChange={e=> updateCreditMode(e.target.value)} style={{fontSize:'.6rem'}}>
              <option value="full">Full</option>
              <option value="elapsed">Elapsed</option>
            </select>
          </label>
          <label style={{display:'flex', flexDirection:'column', alignItems:'flex-start', gap:'.15rem'}}>
            <span>Long every</span>
            <input type="number" min={1} max={12} value={longBreakEvery} style={{width:'3.5rem'}} onChange={e=> updateLongBreakEvery(Number(e.target.value))} />
          </label>
        </form>
        <div className="card" style={{width:'100%', maxWidth:620, padding:'1rem 1rem 1.25rem', background:'var(--surface-1)', border:'1px solid var(--border)', boxShadow:'0 2px 4px -2px rgba(0,0,0,.4), 0 4px 12px -2px rgba(0,0,0,.25)'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'.75rem'}}>
            <h3 style={{margin:0, fontSize:'.7rem', letterSpacing:'.12em', textTransform:'uppercase', color:'var(--text-muted)'}}>Custom Focus Session</h3>
            <span style={{fontSize:'.55rem', color:'var(--text-muted)'}}>
              {(() => { const raw=Number(customInputRef.current?.value||0); if(!raw) return 'Pick a duration'; const end=new Date(Date.now()+raw*60000); return 'Ends ~ '+end.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'}); })()}
            </span>
          </div>
          <div style={{display:'flex', gap:'1rem', flexWrap:'wrap', alignItems:'flex-start'}}>
            <div style={{display:'flex', flexDirection:'column', gap:'.4rem'}}>
              <div style={{display:'flex', alignItems:'center', gap:'.4rem'}}>
                <button type="button" className="btn subtle" style={{fontSize:'.6rem', padding:'.2rem .55rem'}} disabled={!!active} onClick={() => { const cur=Number(customInputRef.current?.value||0); if(cur>1 && customInputRef.current) customInputRef.current.value=String(cur-1); }}>-</button>
                <input ref={customInputRef} placeholder="mins" type="number" min={1} style={{width:'4.5rem', textAlign:'center'}} disabled={!!active && false} onKeyDown={e=>{ if(e.key==='Enter'){ const val=Number((e.target as HTMLInputElement).value); if(val>0) start({mode:'focus', taskId:selectedTaskId, durationSec: val*60}); } }} />
                <button type="button" className="btn subtle" style={{fontSize:'.6rem', padding:'.2rem .55rem'}} disabled={!!active} onClick={() => { const cur=Number(customInputRef.current?.value||0); const next=cur?cur+1:1; if(customInputRef.current) customInputRef.current.value=String(next); }}>+</button>
                <button type="button" className="btn primary" style={{fontSize:'.6rem'}} disabled={!!active} onClick={()=>{ const val=Number(customInputRef.current?.value||0); if(val>0) start({mode:'focus', taskId:selectedTaskId, durationSec: val*60}); }}>Start</button>
              </div>
              <div style={{fontSize:'.5rem', color:'var(--text-muted)', textAlign:'center'}}>Enter minutes or use presets</div>
            </div>
            <div style={{flexGrow:1, minWidth:240}}>
              <div style={{display:'flex', flexWrap:'wrap', gap:'.4rem'}}>
                {[5,10,15,20,25,30,35,40,45,50,55,60].map(p => {
                  const activePreset = selectedPreset === p && !active;
                  return (
                    <button
                      key={p}
                      type="button"
                      disabled={!!active}
                      className={`btn ${activePreset ? 'primary' : 'subtle'}`}
                      style={{fontSize:'.55rem', padding:'.3rem .55rem'}}
                      onClick={()=>{ if(customInputRef.current) customInputRef.current.value=String(p); setSelectedPreset(p); start({mode:'focus', taskId:selectedTaskId, durationSec:p*60}); }}
                    >{p}m</button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      <section className="card ff-stack" style={{padding:'1rem 1rem 1.25rem', gap:'.75rem'}}>
        <header style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h2 style={{fontSize:'.8rem', fontWeight:600}}>Recent Sessions</h2>
          <span style={{fontSize:'.55rem', color:'var(--text-muted)'}}>
            Total Focus Today: {Math.round(sessions
              .filter((s: any)=> s.mode==='focus' && s.endedAt && new Date(s.startedAt).toDateString()=== new Date().toDateString())
              .reduce((a: number,b: any)=> a + b.durationSec,0)/60)}m
          </span>
        </header>
        <ul className="ff-stack" style={{listStyle:'none', margin:0, padding:0, gap:'.35rem', maxHeight:'12rem', overflowY:'auto'}}>
          {sessions.slice().reverse().slice(0,25).map((s: any) => {
            const task = tasks.find(t=> t.id===s.taskId);
            const durMin = Math.round(s.durationSec/60);
            const label = s.mode==='focus' ? 'Focus' : s.mode==='shortBreak' ? 'Short' : 'Long';
            return (
              <li key={s.id} style={{display:'flex', alignItems:'center', gap:'.5rem', fontSize:'.55rem'}}>
                <span style={{padding:'.15rem .45rem', borderRadius:4, background:'var(--surface-2)', color:'var(--text-secondary)'}}>{label}</span>
                <span style={{color:'var(--text-primary)'}}>{durMin}m</span>
                {task && <span style={{color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'10rem'}}>• {task.title}</span>}
                <span style={{marginLeft:'auto', color:'var(--text-muted)'}}>{new Date(s.startedAt).toLocaleTimeString(undefined,{hour:'2-digit', minute:'2-digit'})}</span>
              </li>
            );
          })}
          {sessions.length===0 && <li style={{fontSize:'.55rem', color:'var(--text-muted)'}}>No sessions yet.</li>}
        </ul>
      </section>
      <div ref={announcerRef} aria-live="polite" style={{position:'absolute', width:0, height:0, overflow:'hidden'}} />
    </div>
  );
}