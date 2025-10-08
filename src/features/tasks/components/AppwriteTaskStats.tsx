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
    <div className="card w-full">
      <div className="flex justify-between items-baseline mb-2">
        <h3 className="m-0 text-[0.65rem] sm:text-[0.7rem] tracking-wider uppercase text-[var(--text-muted)]">Overall Progress</h3>
        <span className="text-[0.65rem] sm:text-[0.7rem] font-semibold">{loading ? '--' : pct}%</span>
      </div>
      <div className="relative h-3 sm:h-3.5 rounded-lg bg-[var(--bg-alt)] overflow-hidden shadow-[inset_0_0_0_1px_var(--border)]" aria-label="Completion progress">
        <div className="absolute top-0 left-0 bottom-0 rounded-lg transition-[width] duration-600 ease-[cubic-bezier(0.4,0,0.2,1)]" style={{
          width: loading ? '0%' : `${pct}%`,
          background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-accent2) 100%)'
        }} />
      </div>
    </div>
  );
};

export default AppwriteTaskStats;