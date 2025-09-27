import { useMemo } from 'react';
import { usePomodoro } from '../features/pomodoro/PomodoroContext';

function buildCSV(rows: any[]) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    if (v == null) return '';
    const s = String(v);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g,'""') + '"';
    return s;
  };
  return [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n');
}

export default function InsightsPage() {
  const { sessions } = usePomodoro();

  const exportRows = useMemo(() => sessions.map(s => ({
    id: s.id,
    mode: s.mode,
    startedAt: s.startedAt,
    endedAt: s.endedAt || '',
    durationSec: s.durationSec,
    durationMin: Math.round(s.durationSec/60),
    taskId: s.taskId || '',
  })), [sessions]);

  const download = (data: string | Blob, filename: string) => {
    const blob = typeof data === 'string' ? new Blob([data], { type: 'text/plain;charset=utf-8' }) : data;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(()=> URL.revokeObjectURL(url), 2000);
  };

  const handleExportJSON = () => {
    download(JSON.stringify(exportRows, null, 2), `pomodoro-sessions-${new Date().toISOString().slice(0,10)}.json`);
  };
  const handleExportCSV = () => {
    download(buildCSV(exportRows), `pomodoro-sessions-${new Date().toISOString().slice(0,10)}.csv`);
  };

  // Build last 7 days focus minutes dataset
  const last7 = useMemo(() => {
    const days: { label: string; dateKey: string; minutes: number }[] = [];
    const today = new Date(); today.setHours(0,0,0,0);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getTime() - i*86400000);
      const key = d.toISOString().slice(0,10);
      const label = d.toLocaleDateString(undefined,{ weekday:'short' });
      days.push({ label, dateKey: key, minutes: 0 });
    }
    sessions.forEach(s => {
      if (s.mode !== 'focus' || !s.endedAt) return;
      const key = s.startedAt.slice(0,10);
      const bucket = days.find(d => d.dateKey === key);
      if (bucket) bucket.minutes += Math.round(s.durationSec/60);
    });
    return days;
  }, [sessions]);

  const maxMinutes = last7.reduce((m,d)=> Math.max(m, d.minutes), 0) || 1;

  function WeeklyChart() {
    const w = 360; const h = 120; const pad = 24;
    const pts = last7.map((d,i) => {
      const x = pad + (i/(last7.length-1)) * (w - pad*2);
      const y = h - pad - (d.minutes / maxMinutes) * (h - pad*2);
      return { x, y, m: d.minutes, lbl: d.label };
    });
    const path = pts.map((p,i)=> `${i===0? 'M':'L'}${p.x},${p.y}`).join(' ');
    const area = `${['M',pts[0].x, h-pad].join(' ')} L${pts.map(p=> `${p.x},${p.y}`).join(' L')} L${pts[pts.length-1].x},${h-pad} Z`;
    return (
      <svg width={w} height={h} role="img" aria-label="Focus minutes last 7 days">
        <defs>
          <linearGradient id="weeklyArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.55} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <rect x={0} y={0} width={w} height={h} fill="var(--surface-1)" rx={8} />
        <path d={area} fill="url(#weeklyArea)" />
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2} />
        {pts.map(p => (
          <g key={p.x}>
            <circle cx={p.x} cy={p.y} r={3} fill="var(--accent)" />
            <text x={p.x} y={h-6} textAnchor="middle" fontSize={10} fill="var(--text-muted)">{p.lbl}</text>
            <text x={p.x} y={p.y-8} textAnchor="middle" fontSize={9} fill="var(--text-secondary)">{p.m}</text>
          </g>
        ))}
        <text x={pad} y={14} fontSize={10} fill="var(--text-muted)">Weekly Focus (min)</text>
      </svg>
    );
  }

  return (
    <div className="ff-stack" style={{gap:'1.5rem'}}>
      <header className="ff-stack" style={{gap:'.4rem'}}>
        <h1 style={{fontSize:'1.4rem', fontWeight:600}}>Insights</h1>
        <p style={{fontSize:'.75rem', color:'var(--text-muted)'}}>Export and analyze your focus history.</p>
        <div className="ff-row" style={{gap:'.5rem', flexWrap:'wrap'}}>
          <button className="btn primary" onClick={handleExportCSV} disabled={!sessions.length} style={{fontSize:'.6rem'}}>Export CSV</button>
          <button className="btn" onClick={handleExportJSON} disabled={!sessions.length} style={{fontSize:'.6rem'}}>Export JSON</button>
          {!sessions.length && <span style={{fontSize:'.55rem', color:'var(--text-muted)'}}>No sessions yet</span>}
        </div>
      </header>
      <section className="card ff-stack" style={{padding:'1rem', gap:'.6rem'}}>
        <h2 style={{fontSize:'.85rem', margin:0}}>Recent Sessions Snapshot</h2>
        <div style={{overflowX:'auto'}}>
          <WeeklyChart />
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%', borderCollapse:'collapse', fontSize:'.55rem'}}>
            <thead>
              <tr style={{textAlign:'left'}}>
                <th>ID</th>
                <th>Mode</th>
                <th>Started</th>
                <th>Ended</th>
                <th>Min</th>
                <th>Task</th>
              </tr>
            </thead>
            <tbody>
              {exportRows.slice().reverse().slice(0,25).map(r => (
                <tr key={r.id} style={{borderTop:'1px solid var(--border)'}}>
                  <td style={{padding:'.25rem .4rem', whiteSpace:'nowrap'}}>{r.id.slice(0,6)}</td>
                  <td style={{padding:'.25rem .4rem'}}>{r.mode}</td>
                  <td style={{padding:'.25rem .4rem', whiteSpace:'nowrap'}}>{new Date(r.startedAt).toLocaleString(undefined,{hour:'2-digit', minute:'2-digit', month:'short', day:'numeric'})}</td>
                  <td style={{padding:'.25rem .4rem', whiteSpace:'nowrap'}}>{r.endedAt ? new Date(r.endedAt).toLocaleTimeString(undefined,{hour:'2-digit', minute:'2-digit'}) : ''}</td>
                  <td style={{padding:'.25rem .4rem'}}>{r.durationMin}</td>
                  <td style={{padding:'.25rem .4rem'}}>{r.taskId ? r.taskId.slice(0,6) : ''}</td>
                </tr>
              ))}
              {exportRows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{padding:'.5rem', textAlign:'center', color:'var(--text-muted)'}}>No sessions recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}