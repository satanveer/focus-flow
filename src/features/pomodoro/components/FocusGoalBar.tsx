import React, { useMemo } from 'react';
import { usePomodoro } from '../PomodoroContext';

// Simple horizontal progress bar for daily focus goal & streak
export const FocusGoalBar: React.FC = () => {
  const { sessions, goalMinutes } = usePomodoro();

  const { todayMinutes, pct } = useMemo(() => {
    const todayStr = new Date().toDateString();
    const focusSeconds = sessions
      .filter(s => s.mode === 'focus' && s.endedAt && new Date(s.startedAt).toDateString() === todayStr)
      .reduce((a, b) => a + b.durationSec, 0);
    const todayMinutes = Math.round(focusSeconds / 60);
    const pct = Math.min(100, (todayMinutes / goalMinutes) * 100);
    return { todayMinutes, pct };
  }, [sessions, goalMinutes]);

  return (
    <div className="card" style={{padding:'0.9rem 1rem', display:'flex', flexDirection:'column', gap:'0.5rem'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
        <span style={{fontSize:'.7rem', letterSpacing:'.12em', textTransform:'uppercase', color:'var(--text-muted)'}}>Daily Focus Goal</span>
        <span style={{fontSize:'.7rem'}}>{todayMinutes} / {goalMinutes}m</span>
      </div>
      <div style={{position:'relative', height:8, background:'var(--surface-2)', borderRadius:4, overflow:'hidden'}}>
        <div style={{position:'absolute', inset:0, background:'linear-gradient(90deg,var(--accent) 0%, var(--accent-alt) 100%)', width:`${pct}%`, transition:'width .4s'}} />
      </div>
    </div>
  );
};

export default FocusGoalBar;
