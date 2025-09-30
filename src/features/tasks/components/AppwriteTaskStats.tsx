import React from 'react';
import { useAppwriteTasksContext } from '../AppwriteTasksContext';

export const AppwriteTaskStats: React.FC = () => {
  const { stats, loading } = useAppwriteTasksContext();
  const pct = stats.total === 0 ? 0 : Math.round(stats.completionRate * 100);
  const focusMins = Math.round(stats.totalFocusSeconds / 60);

  if (loading) {
    return (
      <div className="ff-stack">
        <div className="stats-grid">
          <div className="stat-card"><span>Total</span><strong>--</strong></div>
          <div className="stat-card"><span>Completed</span><strong>--</strong></div>
          <div className="stat-card"><span>Progress</span><strong>--%</strong></div>
          <div className="stat-card"><span>Focus</span><strong>--m</strong></div>
        </div>
      </div>
    );
  }

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

export const AppwriteTaskProgressBar: React.FC = () => {
  const { stats, loading } = useAppwriteTasksContext();
  const pct = stats.total === 0 ? 0 : Math.round(stats.completionRate * 100);
  
  return (
    <div className="card" style={{padding:'1rem', width:'100%'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:'.5rem'}}>
        <h3 style={{margin:0, fontSize:'.7rem', letterSpacing:'.08em', textTransform:'uppercase', color:'var(--text-muted)'}}>Overall Progress</h3>
        <span style={{fontSize:'.7rem', fontWeight:600}}>{loading ? '--' : pct}%</span>
      </div>
      <div style={{position:'relative', height:'14px', borderRadius:'8px', background:'var(--bg-alt)', overflow:'hidden', boxShadow:'inset 0 0 0 1px var(--border)'}} aria-label="Completion progress">
        <div style={{
          position:'absolute',
          top:0,
          left:0,
          bottom:0,
          width: loading ? '0%' : `${pct}%`,
          background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-accent2) 100%)',
          transition:'width .6s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRadius:'8px'
        }} />
      </div>
    </div>
  );
};

export default AppwriteTaskStats;