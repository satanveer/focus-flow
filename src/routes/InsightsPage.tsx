import { useMemo, useState, useEffect } from 'react';
import { usePomodoro } from '../features/pomodoro/PomodoroContext';
import { useAppwriteTasksContext } from '../features/tasks/AppwriteTasksContext';
import type { ProductivityRating } from '../domain/models';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList,
  BarChart, Bar, CartesianGrid
} from 'recharts';

type RangeMode = 'daily' | 'weekly' | 'monthly';

export default function InsightsPage() {
  const { sessions } = usePomodoro();
  const { tasks } = useAppwriteTasksContext();
  const [range, setRange] = useState<RangeMode>('weekly');
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, etc.
  const [dayOffset, setDayOffset] = useState(0); // 0 = today, -1 = yesterday, etc.
  const [monthOffset, setMonthOffset] = useState(0); // 0 = current month, -1 = last month, etc.
  const [sessionsPage, setSessionsPage] = useState(0); // Pagination for sessions table
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // Reset offsets when changing range modes
  useEffect(() => {
    setWeekOffset(0);
    setDayOffset(0);
    setMonthOffset(0);
  }, [range]);

  // Reset sessions page when range or offsets change
  useEffect(() => {
    setSessionsPage(0);
  }, [range, weekOffset, dayOffset, monthOffset]);

  // Filter sessions according to selected range
  const filteredSessions = useMemo(() => {
    if(!sessions.length) return [] as typeof sessions;
    if(range==='daily'){
      const targetDay = new Date(startOfToday.getTime() + dayOffset * 86400000);
      return sessions.filter(s => {
        const d = new Date(s.startedAt);
        return d.getFullYear()=== targetDay.getFullYear() && d.getMonth()=== targetDay.getMonth() && d.getDate()=== targetDay.getDate();
      });
    }
    if(range==='weekly'){
      // Calculate the week start based on offset
      const weekStart = new Date(startOfToday.getTime() - 6*86400000 + weekOffset * 7 * 86400000);
      const weekEnd = new Date(weekStart.getTime() + 6*86400000);
      return sessions.filter(s => {
        const sessionDate = new Date(s.startedAt);
        return sessionDate >= weekStart && sessionDate <= weekEnd;
      });
    }
    // monthly - calculate based on monthOffset
    const targetMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth() + monthOffset, 1);
    const monthStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
    const monthEnd = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0, 23, 59, 59);
    return sessions.filter(s => {
      const sessionDate = new Date(s.startedAt);
      return sessionDate >= monthStart && sessionDate <= monthEnd;
    });
  }, [sessions, range, startOfToday, weekOffset, dayOffset, monthOffset]);

  const exportRows = useMemo(() => filteredSessions.map(s => ({
    id: s.id,
    mode: s.mode,
    startedAt: s.startedAt,
    endedAt: s.endedAt || '',
    durationSec: s.durationSec,
    durationMin: Math.round(s.durationSec/60),
    taskId: s.taskId || '',
  })), [filteredSessions]);

  // Helper for consistent local date key
  const dateKey = (d: Date) => [d.getFullYear(), (d.getMonth()+1).toString().padStart(2,'0'), d.getDate().toString().padStart(2,'0')].join('-');

  // Aggregated datasets for charts depending on range (include sessions count)
  const focusAggregations = useMemo(() => {
    const focusSessions = filteredSessions.filter(s => s.mode==='focus' && s.endedAt);
    if(range==='daily'){
      const hours = Array.from({length:24}, (_,h)=> ({ hour: h, label: h.toString().padStart(2,'0'), minutes:0, sessions:0 }));
      focusSessions.forEach(s => {
        const d = new Date(s.startedAt); const h = d.getHours();
        const bucket = hours[h];
        bucket.minutes += Math.round(s.durationSec/60);
        bucket.sessions += 1;
      });
      return hours;
    }
    if(range==='weekly'){
      const days: { dateKey:string; label:string; minutes:number; sessions:number }[] = [];
      const base = new Date(startOfToday.getTime() - 6*86400000 + weekOffset * 7 * 86400000);
      for(let i=0;i<7;i++){
        const d = new Date(base.getTime() + i*86400000);
        days.push({ dateKey: dateKey(d), label: d.toLocaleDateString(undefined,{weekday:'short'}), minutes:0, sessions:0 });
      }
      focusSessions.forEach(s=> { const dk = dateKey(new Date(s.startedAt)); const bucket = days.find(d=> d.dateKey===dk); if(bucket){ bucket.minutes += Math.round(s.durationSec/60); bucket.sessions += 1; } });
      return days;
    }
    // Monthly - show days in the selected month
    const days: { dateKey:string; label:string; minutes:number; sessions:number }[] = [];
    const targetMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth() + monthOffset, 1);
    const daysInMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
    for(let i=1; i<=daysInMonth; i++){
      const d = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), i);
      days.push({ dateKey: dateKey(d), label: i.toString(), minutes:0, sessions:0 });
    }
    focusSessions.forEach(s=> { const dk = dateKey(new Date(s.startedAt)); const bucket = days.find(d=> d.dateKey===dk); if(bucket){ bucket.minutes += Math.round(s.durationSec/60); bucket.sessions += 1; } });
    return days;
  }, [filteredSessions, range, startOfToday, weekOffset, monthOffset]);

  // Stats cards
  const stats = useMemo(()=> {
    if(!filteredSessions.length) return null;
    const focus = filteredSessions.filter(s=> s.mode==='focus');
    const breaks = filteredSessions.filter(s=> s.mode!=='focus');
    const focusMinutes = focus.reduce((a,s)=> a + Math.round(s.durationSec/60), 0);
    const totalMinutes = filteredSessions.reduce((a,s)=> a + Math.round(s.durationSec/60), 0) || 1;
    const avgFocus = focusMinutes && focus.length ? (focusMinutes / focus.length) : 0;
    
    // Calculate productivity based on user ratings for focus sessions
    let productivity = 0;
    const focusSessionsWithRatings = focus.filter(s => s.productivityRating);
    
    if (focusSessionsWithRatings.length > 0) {
      // Use weighted scoring: Great=100, Some distractions=60, Unfocused=20
      const ratingScores: Record<ProductivityRating, number> = {
        'great': 100,
        'some-distractions': 60,
        'unfocused': 20
      };
      
      const totalScore = focusSessionsWithRatings.reduce((sum, session) => {
        return sum + (ratingScores[session.productivityRating as ProductivityRating] || 0);
      }, 0);
      
      productivity = totalScore / focusSessionsWithRatings.length;
    } else {
      // Fallback to old calculation if no ratings available
      productivity = (focusMinutes / totalMinutes) * 100;
    }
    
    let streak = 0; for(let i=filteredSessions.length-1;i>=0;i--){ if(filteredSessions[i].mode==='focus') streak++; else break; }
    return { focusMinutes, sessions: filteredSessions.length, avgFocus, productivity, streak, breakCount: breaks.length };
  }, [filteredSessions]);

  // Daily task-level aggregation (only when range==='daily')
  const dailyTaskFocus = useMemo(() => {
    if(range !== 'daily') return [] as { taskId: string | null; title: string; minutes: number; sessions: number; avg: number; last: string }[];
    const map: Record<string, { taskId: string | null; minutes: number; sessions: number; last: string }> = {};
    filteredSessions.forEach(s => {
      if(s.mode !== 'focus' || !s.endedAt) return;
      const key = s.taskId || '__none';
      if(!map[key]) map[key] = { taskId: s.taskId || null, minutes:0, sessions:0, last: s.endedAt };
      map[key].minutes += Math.round(s.durationSec/60);
      map[key].sessions += 1;
      if(new Date(s.endedAt!) > new Date(map[key].last)) map[key].last = s.endedAt!;
    });
    const rows = Object.values(map).map(r => {
      const task = r.taskId ? tasks.find(t=> t.id===r.taskId) : null;
      return {
        taskId: r.taskId,
        title: task ? task.title : 'Unassigned',
        minutes: r.minutes,
        sessions: r.sessions,
        avg: r.sessions? (r.minutes / r.sessions): 0,
        last: r.last,
      };
    }).sort((a,b)=> b.minutes - a.minutes);
    return rows;
  }, [range, filteredSessions, tasks]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if(active && payload && payload.length){
      const p = payload[0].payload;
      return (
        <div style={{background:'var(--surface)', border:'1px solid var(--border)', padding:'.4rem .55rem', borderRadius:6, fontSize:'.55rem'}}>
          <div style={{fontWeight:600, marginBottom:2}}>{label}</div>
          <div>Focus: {p.minutes} min</div>
          {p.sessions !== undefined && <div>Sessions: {p.sessions}</div>}
        </div>
      );
    }
    return null;
  };

  function ChartArea(){
    if(!filteredSessions.length) return <div style={{padding:'.75rem', fontSize:'.6rem', color:'var(--text-muted)'}}>No sessions in this range.</div>;
    if(range==='daily'){
      const all = focusAggregations as any[];
      return (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={all} margin={{top:12,right:10,left:4,bottom:6}}>
            <defs>
              <linearGradient id="dailyFocus" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.9} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{fontSize:9}} stroke="var(--text-muted)" interval={1} />
            <YAxis tick={{fontSize:10}} stroke="var(--text-muted)" width={32} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="minutes" fill="url(#dailyFocus)" radius={[3,3,0,0]} maxBarSize={18}>
              {all.map((d,i)=> (
                <Cell key={i} fillOpacity={d.minutes===0?0.18:1} />
              ))}
              <LabelList dataKey="minutes" position="top" formatter={(val: any)=> (typeof val==='number' && val>0)? val: ''} style={{fontSize:10, fill:'var(--text-muted)'}} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }
    const data = focusAggregations as any[];
    return (
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{top:10,right:20,left:0,bottom:8}}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="label" tick={{fontSize: (range==='monthly'? 9:11)}} interval={range==='monthly'? 2:0} angle={range==='monthly'? -25:0} textAnchor={range==='monthly'? 'end':'middle'} height={range==='monthly'? 50: 30} stroke="var(--text-muted)" />
          <YAxis tick={{fontSize:11}} width={40} stroke="var(--text-muted)" />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="minutes" stroke="var(--accent)" strokeWidth={2} dot={{r:3}} activeDot={{r:5}} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <div className="ff-stack" style={{gap:'1.5rem'}}>
      <header className="ff-stack" style={{gap:'.4rem'}}>
  <h1 style={{fontSize:'1.4rem', fontWeight:600}}>Insights</h1>
        <p style={{fontSize:'.75rem', color:'var(--text-muted)'}}>Analyze your focus performance across time ranges.</p>
        <div className="ff-row" style={{gap:4, background:'var(--surface)', padding:4, border:'1px solid var(--border)', borderRadius:999}} aria-label="Select range">
          {(['daily','weekly','monthly'] as RangeMode[]).map(mode => (
            <button
              key={mode}
              onClick={()=> setRange(mode)}
              className={`btn ${range===mode? 'primary':''}`}
              style={{fontSize:'.55rem', padding:'.35rem .7rem', borderRadius:999}}
              aria-pressed={range===mode}
            >{mode.charAt(0).toUpperCase()+mode.slice(1)}</button>
          ))}
        </div>
      </header>

      {/* Stats Cards */}
      <div className="ff-row" style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px,1fr))', gap:'.75rem'}}>
        {stats ? (
          <>
            <StatCard label="Focus Minutes" value={stats?.focusMinutes} accent />
            <StatCard label="Sessions" value={stats?.sessions} />
            <StatCard label="Avg Focus" value={stats? stats.avgFocus.toFixed(1)+'m': '0m'} />
            <StatCard label="Productivity" value={stats? stats.productivity.toFixed(0)+'%':'0%'} />
            <StatCard label="Focus Streak" value={stats?.streak} />
            <StatCard label="Breaks" value={stats?.breakCount} />
          </>
        ) : (
          <div style={{fontSize:'.6rem', color:'var(--text-muted)'}}>No sessions yet.</div>
        )}
      </div>

      <section className="card ff-stack" style={{padding:'1rem', gap:'.8rem'}}>
        <div className="ff-row" style={{justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'.5rem'}}>
          <div className="ff-row" style={{alignItems:'center', gap:'.5rem'}}>
            <h2 style={{fontSize:'.85rem', margin:0}}>
              {range==='daily'? 'Hourly Focus':'Focus Trend'}
            </h2>
            <span style={{fontSize:'.55rem', color:'var(--text-muted)'}}>
              {range==='daily'? (() => {
                const targetDay = new Date(startOfToday.getTime() + dayOffset * 86400000);
                return targetDay.toLocaleDateString(undefined,{weekday:'long', month:'short', day:'numeric', year: dayOffset < -30 || dayOffset > 30 ? 'numeric' : undefined});
              })() : range==='weekly'? (() => {
                const base = new Date(startOfToday.getTime() - 6*86400000 + weekOffset * 7 * 86400000);
                const end = new Date(base.getTime() + 6*86400000);
                return `${base.toLocaleDateString(undefined,{month:'short', day:'numeric'})} - ${end.toLocaleDateString(undefined,{month:'short', day:'numeric'})}`;
              })() : (() => {
                const targetMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth() + monthOffset, 1);
                return targetMonth.toLocaleDateString(undefined,{month:'long', year:'numeric'});
              })()}
            </span>
          </div>
          {range === 'daily' && (
            <div className="ff-row" style={{gap:4, background:'var(--surface)', padding:4, border:'1px solid var(--border)', borderRadius:999}}>
              <button 
                onClick={() => setDayOffset(dayOffset - 1)} 
                className="btn subtle"
                style={{fontSize:'.55rem', padding:'.35rem .65rem', borderRadius:999}}
                aria-label="Previous day"
              >
                ← Prev
              </button>
              <button 
                onClick={() => setDayOffset(0)} 
                className={`btn ${dayOffset === 0 ? 'primary' : 'subtle'}`}
                style={{fontSize:'.55rem', padding:'.35rem .65rem', borderRadius:999}}
                aria-label="Today"
              >
                Today
              </button>
              <button 
                onClick={() => setDayOffset(dayOffset + 1)} 
                className="btn subtle"
                style={{fontSize:'.55rem', padding:'.35rem .65rem', borderRadius:999}}
                disabled={dayOffset >= 0}
                aria-label="Next day"
              >
                Next →
              </button>
            </div>
          )}
          {range === 'weekly' && (
            <div className="ff-row" style={{gap:4, background:'var(--surface)', padding:4, border:'1px solid var(--border)', borderRadius:999}}>
              <button 
                onClick={() => setWeekOffset(weekOffset - 1)} 
                className="btn subtle"
                style={{fontSize:'.55rem', padding:'.35rem .65rem', borderRadius:999}}
                aria-label="Previous week"
              >
                ← Prev
              </button>
              <button 
                onClick={() => setWeekOffset(0)} 
                className={`btn ${weekOffset === 0 ? 'primary' : 'subtle'}`}
                style={{fontSize:'.55rem', padding:'.35rem .65rem', borderRadius:999}}
                aria-label="Current week"
              >
                Current
              </button>
              <button 
                onClick={() => setWeekOffset(weekOffset + 1)} 
                className="btn subtle"
                style={{fontSize:'.55rem', padding:'.35rem .65rem', borderRadius:999}}
                disabled={weekOffset >= 0}
                aria-label="Next week"
              >
                Next →
              </button>
            </div>
          )}
          {range === 'monthly' && (
            <div className="ff-row" style={{gap:4, background:'var(--surface)', padding:4, border:'1px solid var(--border)', borderRadius:999}}>
              <button 
                onClick={() => setMonthOffset(monthOffset - 1)} 
                className="btn subtle"
                style={{fontSize:'.55rem', padding:'.35rem .65rem', borderRadius:999}}
                aria-label="Previous month"
              >
                ← Prev
              </button>
              <button 
                onClick={() => setMonthOffset(0)} 
                className={`btn ${monthOffset === 0 ? 'primary' : 'subtle'}`}
                style={{fontSize:'.55rem', padding:'.35rem .65rem', borderRadius:999}}
                aria-label="Current month"
              >
                Current
              </button>
              <button 
                onClick={() => setMonthOffset(monthOffset + 1)} 
                className="btn subtle"
                style={{fontSize:'.55rem', padding:'.35rem .65rem', borderRadius:999}}
                disabled={monthOffset >= 0}
                aria-label="Next month"
              >
                Next →
              </button>
            </div>
          )}
        </div>
        <ChartArea />
      </section>

      {range==='daily' && (
        <section className="card ff-stack" style={{padding:'1rem', gap:'.6rem'}}>
          <h2 style={{fontSize:'.85rem', margin:0}}>
            {dayOffset === 0 ? "Today's Task Focus" : "Task Focus"}
          </h2>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%', borderCollapse:'collapse', fontSize:'.55rem'}}>
              <thead>
                <tr style={{textAlign:'left'}}>
                  <th style={{padding:'.3rem .4rem'}}>Task</th>
                  <th style={{padding:'.3rem .4rem'}}>Sessions</th>
                  <th style={{padding:'.3rem .4rem'}}>Focus Min</th>
                  <th style={{padding:'.3rem .4rem'}}>Avg / Session</th>
                  <th style={{padding:'.3rem .4rem'}}>Last</th>
                </tr>
              </thead>
              <tbody>
                {dailyTaskFocus.map(r => (
                  <tr key={r.taskId || 'none'} style={{borderTop:'1px solid var(--border)'}}>
                    <td style={{padding:'.3rem .4rem', whiteSpace:'nowrap', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis'}}>{r.title}</td>
                    <td style={{padding:'.3rem .4rem'}}>{r.sessions}</td>
                    <td style={{padding:'.3rem .4rem'}}>{r.minutes}</td>
                    <td style={{padding:'.3rem .4rem'}}>{r.avg.toFixed(1)}m</td>
                    <td style={{padding:'.3rem .4rem', whiteSpace:'nowrap'}}>{new Date(r.last).toLocaleTimeString(undefined,{hour:'2-digit', minute:'2-digit'})}</td>
                  </tr>
                ))}
                {dailyTaskFocus.length===0 && (
                  <tr>
                    <td colSpan={5} style={{padding:'.55rem', textAlign:'center', color:'var(--text-muted)'}}>No focus sessions today.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="card ff-stack" style={{padding:'1rem', gap:'.6rem'}}>
        <div className="ff-row" style={{justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'.5rem'}}>
          <h2 style={{fontSize:'.85rem', margin:0}}>Sessions ({exportRows.length})</h2>
          {exportRows.length > 5 && (
            <div className="ff-row" style={{gap:4, alignItems:'center', background:'var(--surface)', padding:4, border:'1px solid var(--border)', borderRadius:999}}>
              <button 
                onClick={() => setSessionsPage(Math.max(0, sessionsPage - 1))} 
                className="btn subtle"
                style={{fontSize:'.55rem', padding:'.3rem .55rem', borderRadius:999}}
                disabled={sessionsPage === 0}
                aria-label="Previous page"
              >
                ←
              </button>
              <span style={{fontSize:'.55rem', color:'var(--text-muted)', padding:'0 .4rem', whiteSpace:'nowrap'}}>
                {sessionsPage + 1} / {Math.ceil(exportRows.length / 5)}
              </span>
              <button 
                onClick={() => setSessionsPage(Math.min(Math.ceil(exportRows.length / 5) - 1, sessionsPage + 1))} 
                className="btn subtle"
                style={{fontSize:'.55rem', padding:'.3rem .55rem', borderRadius:999}}
                disabled={sessionsPage >= Math.ceil(exportRows.length / 5) - 1}
                aria-label="Next page"
              >
                →
              </button>
            </div>
          )}
        </div>
        <div style={{overflowX:'auto', minHeight: '240px', maxHeight: '240px'}}>
          <table style={{width:'100%', borderCollapse:'collapse', fontSize:'.55rem'}} className="sessions-table">
            <thead style={{position:'sticky', top:0, background:'var(--surface)', zIndex:1}}>
              <tr style={{textAlign:'left'}}>
                <th style={{padding:'.35rem .45rem'}}>Mode</th>
                <th style={{padding:'.35rem .45rem'}}>Started</th>
                <th style={{padding:'.35rem .45rem'}}>Ended</th>
                <th style={{padding:'.35rem .45rem'}}>Minutes</th>
              </tr>
            </thead>
            <tbody>
              {exportRows.slice().reverse().slice(sessionsPage * 5, (sessionsPage + 1) * 5).map((r,i) => {
                const modeColor = r.mode==='focus' ? 'var(--accent)' : r.mode==='shortBreak' ? 'var(--info)' : 'var(--warning)';
                const minutesColor = r.mode==='focus' ? 'var(--accent-accent3)' : r.mode==='shortBreak' ? 'var(--info)' : 'var(--warning)';
                return (
                  <tr key={r.id} style={{borderTop:'1px solid var(--border)', background: i % 2 ? 'var(--surface)' : 'var(--surface-elev)'}}>
                    <td style={{padding:'.3rem .45rem'}}>
                      <span style={{display:'inline-block', padding:'.25rem .5rem', borderRadius:999, background:modeColor, color:'var(--accent-foreground)', fontSize:'.5rem', fontWeight:600, letterSpacing:'.05em'}}>
                        {r.mode==='focus' ? 'FOCUS' : r.mode==='shortBreak' ? 'SHORT' : 'LONG'}
                      </span>
                    </td>
                    <td style={{padding:'.3rem .45rem', whiteSpace:'nowrap'}}>{new Date(r.startedAt).toLocaleString(undefined,{hour:'2-digit', minute:'2-digit', month:'short', day:'numeric'})}</td>
                    <td style={{padding:'.3rem .45rem', whiteSpace:'nowrap'}}>{r.endedAt ? new Date(r.endedAt).toLocaleTimeString(undefined,{hour:'2-digit', minute:'2-digit'}) : ''}</td>
                    <td style={{padding:'.3rem .45rem', fontWeight:600, color: minutesColor}}>{r.durationMin}</td>
                  </tr>
                );
              })}
              {exportRows.length === 0 && (
                <tr>
                  <td colSpan={4} style={{padding:'.5rem', textAlign:'center', color:'var(--text-muted)'}}>No sessions recorded.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({label, value, accent}:{label:string; value:any; accent?:boolean}){
  return (
    <div className="card" style={{padding:'.75rem .85rem', display:'flex', flexDirection:'column', gap:'.35rem', background: accent? 'var(--accent)' : 'var(--surface)', color: accent? 'var(--accent-foreground)':'inherit'}}>
      <span style={{fontSize:'.55rem', letterSpacing:'.08em', textTransform:'uppercase', opacity:.75}}>{label}</span>
      <span style={{fontSize:'1rem', fontWeight:600}}>{value}</span>
    </div>
  );
}