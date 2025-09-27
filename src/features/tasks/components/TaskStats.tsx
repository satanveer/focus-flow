import React from 'react';
import { useTasksContext } from '../TasksContext';

export const TaskStats: React.FC = () => {
  const { stats } = useTasksContext();
  const pct = stats.total === 0 ? 0 : Math.round(stats.completionRate * 100);
  const focusMins = Math.round((stats as any).totalFocusSeconds / 60);

  return (
    <div className="ff-stack">
      <div className="stats-grid">
        <div className="stat-card"><span>Total</span><strong>{stats.total}</strong></div>
        <div className="stat-card"><span>Completed</span><strong>{stats.completed}</strong></div>
        <div className="stat-card"><span>Progress</span><strong>{pct}%</strong></div>
        <div className="stat-card"><span>Focus</span><strong>{focusMins}m</strong></div>
      </div>
    </div>
  );
};

export const TaskProgressBar: React.FC = () => {
  const { stats } = useTasksContext();
  const pct = stats.total === 0 ? 0 : Math.round(stats.completionRate * 100);
  return (
    <div className="card" style={{padding:'1rem', width:'100%'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:'.5rem'}}>
        <h3 style={{margin:0, fontSize:'.7rem', letterSpacing:'.08em', textTransform:'uppercase', color:'var(--text-muted)'}}>Overall Progress</h3>
        <span style={{fontSize:'.7rem', fontWeight:600}}>{pct}%</span>
      </div>
      <div style={{position:'relative', height:'14px', borderRadius:'8px', background:'var(--bg-alt)', overflow:'hidden', boxShadow:'inset 0 0 0 1px var(--border)'}} aria-label="Completion progress">
        <div style={{
          position:'absolute', inset:0,
          background:'linear-gradient(90deg,var(--accent) 0%, var(--accent-accent2) 35%, var(--accent-accent3) 65%, var(--accent-accent4) 100%)',
          width:`${pct}%`,
          transition:'width .9s cubic-bezier(.4,0,.2,1)',
          boxShadow:'0 0 0 1px rgba(255,255,255,0.04), 0 2px 4px -1px rgba(0,0,0,0.5)'
        }} />
        <div style={{position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.55rem', fontWeight:600, letterSpacing:'.05em', color:'var(--text)', mixBlendMode:'plus-lighter'}}>
          {pct}%
        </div>
      </div>
      {stats.total > 0 && (
        <div style={{display:'flex', justifyContent:'space-between', marginTop:'.4rem', fontSize:'.55rem', color:'var(--text-muted)'}}>
          <span>{stats.completed} done</span>
          <span>{stats.total - stats.completed} remaining</span>
        </div>
      )}
    </div>
  );
};
