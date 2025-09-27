import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList } from 'recharts';
import FocusGoalBar from '../features/pomodoro/components/FocusGoalBar';
import { usePomodoro } from '../features/pomodoro/PomodoroContext';
import { useTasksContext } from '../features/tasks/TasksContext';
import { Link } from 'react-router-dom';

function format(seconds: number) {
    const m = Math.floor(seconds / 60).toString().padStart(2,'0');
    const s = Math.floor(seconds % 60).toString().padStart(2,'0');
    return `${m}:${s}`;
}

export default function DashboardPage() {
    const { tasks, addTask } = useTasksContext();
    const { start, pause, resume, complete, abort, active, getRemaining, sessions, focusDurations } = usePomodoro() as any;
    const [selectedTaskId, setSelectedTaskId] = useState<string>('');
    const customInputRef = useRef<HTMLInputElement | null>(null);

    // Quick add form
    const [quickTitle, setQuickTitle] = useState('');
    const handleQuickAdd = (e: React.FormEvent) => {
        e.preventDefault();
        const t = quickTitle.trim();
        if (!t) return;
        addTask({ title: t, priority: 'medium', tags: [], dueDate: null });
        setQuickTitle('');
    };

    // Timer widget state
    const [remaining, setRemaining] = useState(getRemaining());
    useEffect(() => { const id = setInterval(()=> setRemaining(getRemaining()), 1000); return ()=> clearInterval(id); }, [getRemaining]);
    const mode = active?.mode || 'focus';
    const totalForMode = active ? active.durationSec : (mode==='focus'? focusDurations.focus : mode==='shortBreak'? focusDurations.shortBreak : focusDurations.longBreak);
    const pct = totalForMode === 0 ? 0 : Math.min(100, Math.max(0, ((totalForMode - remaining) / totalForMode) * 100));
    const ringSize = 140;
    const stroke = 8;
    const radius = (ringSize - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const dash = (pct / 100) * circumference;
    const strokeColor = mode === 'focus' ? 'var(--accent)' : mode === 'shortBreak' ? 'var(--warning)' : 'var(--info)';
    const isRunning = !!active && !active.paused;
    const isPaused = !!active && active.paused;

    // Task slices
    const topPriority = useMemo(() => tasks.filter(t=> !t.completed).sort((a,b)=> (a.priority===b.priority? 0 : a.priority==='high'? -1 : b.priority==='high'?1: a.priority==='medium' && b.priority==='low'? -1 : 1)).slice(0,5), [tasks]);
    const dueSoon = useMemo(() => {
        const now = new Date(); now.setHours(0,0,0,0);
        return tasks.filter(t => !t.completed && t.dueDate).sort((a,b)=> new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()).slice(0,5);
    }, [tasks]);
    const recentSessions = useMemo(()=> sessions.slice().reverse().slice(0,5), [sessions]);
    const todayFocusMinutes = useMemo(()=> sessions.filter((s:any)=> s.mode==='focus' && s.endedAt && new Date(s.startedAt).toDateString()=== new Date().toDateString()).reduce((a:number,b:any)=> a + b.durationSec,0)/60, [sessions]);

    const todayHourly = useMemo(()=> {
        const hours = Array.from({length:24}, (_,h)=> ({ hour:h, label:h.toString().padStart(2,'0'), minutes:0, sessions:0 }));
        sessions.forEach((s:any)=> {
            if(s.mode!=='focus' || !s.endedAt) return;
            const d = new Date(s.startedAt);
            const now = new Date();
            if(d.getFullYear()=== now.getFullYear() && d.getMonth()=== now.getMonth() && d.getDate()=== now.getDate()){
                const h = d.getHours();
                hours[h].minutes += Math.round(s.durationSec/60);
                hours[h].sessions += 1;
            }
        });
        return hours;
    }, [sessions]);

    const DailyTooltip = ({active, payload, label}: any) => {
        if(active && payload && payload.length){
            const p = payload[0].payload;
            return <div style={{background:'var(--surface)', border:'1px solid var(--border)', padding:'.35rem .5rem', borderRadius:6, fontSize:'.55rem'}}>
                <div style={{fontWeight:600, marginBottom:2}}>{label}:00</div>
                <div>{p.minutes} min</div>
                {p.sessions>0 && <div>{p.sessions} session{p.sessions>1?'s':''}</div>}
            </div>;
        }
        return null;
    };

    return (
        <div className="ff-stack" style={{gap:'1.5rem'}}>
            <header className="ff-stack" style={{gap:'.25rem'}}>
                <h1 style={{fontSize:'1.45rem', fontWeight:600}}>Dashboard</h1>
                <p style={{fontSize:'.75rem', color:'var(--text-muted)'}}>Your snapshot of focus, tasks, and progress.</p>
            </header>
            <FocusGoalBar />
            <div className="dashboard-grid" style={{display:'grid', gap:'1rem', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))'}}>
                {/* Mini Timer Widget */}
                <section className="card ff-stack" style={{gap:'.6rem', alignItems:'center'}} aria-label="Mini Pomodoro timer">
                    <h2 style={{fontSize:'.75rem', letterSpacing:'.12em', textTransform:'uppercase', color:'var(--text-muted)', margin:0}}>Timer</h2>
                    <div style={{position:'relative', width:ringSize, height:ringSize}} role="timer" aria-valuemin={0} aria-valuemax={totalForMode} aria-valuenow={totalForMode-remaining} aria-label={`${mode} session timer`}>
                        <svg width={ringSize} height={ringSize}>
                            <circle cx={ringSize/2} cy={ringSize/2} r={radius} stroke="var(--surface-2)" strokeWidth={stroke} fill="none" />
                            <circle cx={ringSize/2} cy={ringSize/2} r={radius} stroke={strokeColor} strokeWidth={stroke} fill="none" strokeDasharray={`${dash} ${circumference-dash}`} strokeLinecap="round" transform={`rotate(-90 ${ringSize/2} ${ringSize/2})`} />
                        </svg>
                        <div style={{position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
                            <div style={{fontSize:'1.4rem', fontWeight:600, fontVariantNumeric:'tabular-nums'}}>{format(remaining)}</div>
                            <div style={{fontSize:'.55rem', color:'var(--text-muted)'}}>{mode==='focus'? 'Focus': mode==='shortBreak'? 'Short':'Long'}</div>
                        </div>
                    </div>
                                        <div className="ff-row" style={{gap:'.35rem', flexWrap:'wrap', justifyContent:'center'}}>
                        {!active && <button className="btn primary" style={{fontSize:'.6rem'}} onClick={()=> start({mode:'focus'})}>Start</button>}
                        {isRunning && <button className="btn" style={{fontSize:'.6rem'}} onClick={pause}>Pause</button>}
                        {isPaused && <button className="btn primary" style={{fontSize:'.6rem'}} onClick={resume}>Resume</button>}
                        {!!active && <button className="btn subtle" style={{fontSize:'.6rem'}} onClick={()=> complete()}>Complete</button>}
                        {!!active && <button className="btn danger" style={{fontSize:'.6rem'}} onClick={()=> abort()}>Abort</button>}
                                                {!active && (
                                                    <button type="button" className="btn subtle" style={{fontSize:'.55rem'}} onClick={()=>{
                                                        try { start({mode:'focus', durationSec:2}); setTimeout(()=> complete(), 1200);} catch {}
                                                    }}>Test Alert</button>
                                                )}
                    </div>
                                        <div className="ff-row" style={{gap:'.3rem', flexWrap:'wrap', justifyContent:'center'}}>
                                            {(['focus','shortBreak','longBreak'] as const).map(m => (
                                                <button key={m} disabled={!!active} onClick={()=> start({mode:m, taskId: selectedTaskId || undefined})} className={`btn ${m===mode && active? 'primary':'outline'}`} style={{fontSize:'.5rem'}}>{m==='focus'? 'F':'S'}{m==='focus'? '':'B'}</button>
                                            ))}
                                        </div>
                                        <div className="ff-stack" style={{gap:'.4rem', width:'100%', alignItems:'stretch'}}>
                                            <div className="ff-row" style={{gap:'.4rem', flexWrap:'wrap', justifyContent:'center'}}>
                                                <select value={selectedTaskId} onChange={e=> setSelectedTaskId(e.target.value)} style={{fontSize:'.55rem', flex:'1 1 120px'}} aria-label="Select task to focus">
                                                    <option value="">(No task)</option>
                                                    {tasks.slice(0,50).map(t=> <option key={t.id} value={t.id}>{t.title}</option>)}
                                                </select>
                                                <div style={{display:'flex', gap:'.25rem', alignItems:'center'}}>
                                                    <input ref={customInputRef} type="number" min={1} placeholder="mins" aria-label="Custom focus minutes" style={{width:'4rem'}} />
                                                    <button type="button" className="btn outline" style={{fontSize:'.55rem'}} disabled={!!active} onClick={()=>{ const val=Number(customInputRef.current?.value||0); if(val>0) start({mode:'focus', taskId:selectedTaskId||undefined, durationSec: val*60}); }}>Go</button>
                                                </div>
                                            </div>
                                            <div className="ff-row" style={{gap:'.3rem', flexWrap:'wrap', justifyContent:'center'}}>
                                                {[5,10,15,20,25].map(p => (
                                                    <button key={p} type="button" disabled={!!active} className="btn subtle" style={{fontSize:'.5rem'}} onClick={()=> start({mode:'focus', taskId:selectedTaskId||undefined, durationSec:p*60})}>{p}m</button>
                                                ))}
                                            </div>
                                        </div>
                    <Link to="/timer" className="btn subtle" style={{fontSize:'.55rem'}}>Full Timer →</Link>
                </section>

                {/* Quick Add Task */}
                <section className="card ff-stack" style={{gap:'.6rem'}} aria-label="Quick add task">
                    <h2 style={{fontSize:'.75rem', letterSpacing:'.12em', textTransform:'uppercase', color:'var(--text-muted)', margin:0}}>Quick Task</h2>
                    <form onSubmit={handleQuickAdd} className="ff-row" style={{gap:'.4rem'}}>
                        <input placeholder="Task title" value={quickTitle} onChange={e=> setQuickTitle(e.target.value)} aria-label="New task title" />
                        <button type="submit" className="btn primary" disabled={!quickTitle.trim()} style={{fontSize:'.6rem'}}>Add</button>
                    </form>
                    <Link to="/tasks" className="btn subtle" style={{fontSize:'.55rem', alignSelf:'flex-start'}}>Tasks →</Link>
                </section>

                {/* Top Priority Tasks */}
                <section className="card ff-stack" style={{gap:'.5rem'}} aria-label="Top priority tasks">
                    <h2 style={{fontSize:'.75rem', letterSpacing:'.12em', textTransform:'uppercase', color:'var(--text-muted)', margin:0}}>Priority</h2>
                    <ul className="ff-stack" style={{listStyle:'none', margin:0, padding:0, gap:'.35rem'}}>
                        {topPriority.map(t => (
                            <li key={t.id} style={{display:'flex', gap:'.4rem', alignItems:'center', fontSize:'.6rem'}}>
                                <span style={{fontWeight:600, flexGrow:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{t.title}</span>
                                <span className={`badge dot priority-${t.priority}`}>{t.priority}</span>
                            </li>
                        ))}
                        {topPriority.length===0 && <li style={{fontSize:'.55rem', color:'var(--text-muted)'}}>No active tasks.</li>}
                    </ul>
                </section>

                {/* Due Soon */}
                <section className="card ff-stack" style={{gap:'.5rem'}} aria-label="Upcoming due tasks">
                    <h2 style={{fontSize:'.75rem', letterSpacing:'.12em', textTransform:'uppercase', color:'var(--text-muted)', margin:0}}>Due Soon</h2>
                    <ul className="ff-stack" style={{listStyle:'none', margin:0, padding:0, gap:'.35rem'}}>
                        {dueSoon.map(t => {
                            const due = t.dueDate ? new Date(t.dueDate).toLocaleDateString(undefined,{month:'short', day:'numeric'}) : '';
                            return (
                                <li key={t.id} style={{display:'flex', gap:'.4rem', alignItems:'center', fontSize:'.6rem'}}>
                                    <span style={{fontWeight:600, flexGrow:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{t.title}</span>
                                    <span style={{color:'var(--text-muted)'}}>{due}</span>
                                </li>
                            );
                        })}
                        {dueSoon.length===0 && <li style={{fontSize:'.55rem', color:'var(--text-muted)'}}>Nothing due soon.</li>}
                    </ul>
                </section>

                {/* Recent Sessions */}
                <section className="card ff-stack" style={{gap:'.5rem'}} aria-label="Recent sessions">
                        <h2 style={{fontSize:'.75rem', letterSpacing:'.12em', textTransform:'uppercase', color:'var(--text-muted)', margin:0}}>Recent</h2>
                        <ul className="ff-stack" style={{listStyle:'none', margin:0, padding:0, gap:'.3rem'}}>
                            {recentSessions.map((s:any) => {
                                const mins = Math.round(s.durationSec/60);
                                const start = new Date(s.startedAt).toLocaleTimeString(undefined,{hour:'2-digit', minute:'2-digit'});
                                return (
                                    <li key={s.id} style={{display:'flex', gap:'.4rem', fontSize:'.55rem', alignItems:'center'}}>
                                        <span style={{padding:'.15rem .4rem', background:'var(--surface-2)', borderRadius:4}}>{s.mode==='focus'? 'F':'B'}</span>
                                        <span>{mins}m</span>
                                        <span style={{color:'var(--text-muted)', marginLeft:'auto'}}>{start}</span>
                                    </li>
                                );
                            })}
                            {recentSessions.length===0 && <li style={{fontSize:'.55rem', color:'var(--text-muted)'}}>No sessions yet.</li>}
                        </ul>
                        <Link to="/insights" className="btn subtle" style={{fontSize:'.55rem', alignSelf:'flex-start'}}>Insights →</Link>
                </section>

            </div>
            {/* Full-width Today Focus chart moved to bottom */}
            <section className="card ff-stack" style={{gap:'.8rem', padding:'1rem'}} aria-label="Today focus chart">
                <div className="ff-row" style={{justifyContent:'space-between', alignItems:'baseline', flexWrap:'wrap', gap:'.5rem'}}>
                    <h2 style={{fontSize:'.85rem', margin:0}}>Today Focus</h2>
                    <span style={{fontSize:'.55rem', color:'var(--text-muted)'}}>Hourly minutes (total: {Math.round(todayFocusMinutes)}m)</span>
                </div>
                <div style={{width:'100%', height:220}}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={todayHourly} margin={{top:8, right:12, left:4, bottom:4}}>
                            <defs>
                                <linearGradient id="dashDaily" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.95} />
                                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.35} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis dataKey="label" tick={{fontSize:9}} stroke="var(--text-muted)" interval={1} />
                            <YAxis tick={{fontSize:10}} stroke="var(--text-muted)" width={34} />
                            <Tooltip content={<DailyTooltip />} />
                            <Bar dataKey="minutes" fill="url(#dashDaily)" radius={[3,3,0,0]} maxBarSize={18}>
                                {todayHourly.map((d,i)=> <Cell key={i} fillOpacity={d.minutes===0?0.18:1} />)}
                                <LabelList dataKey="minutes" position="top" formatter={(v:any)=> (typeof v==='number' && v>0)? v:''} style={{fontSize:9, fill:'var(--text-muted)'}} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </section>
        </div>
    );
}