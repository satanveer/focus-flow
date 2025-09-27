import React, { useMemo, useEffect, useRef } from 'react';
import { usePomodoro } from '../PomodoroContext';

// Simple horizontal progress bar for daily focus goal & streak
export const FocusGoalBar: React.FC = () => {
  const { sessions, goalMinutes } = usePomodoro();

  const prevRef = useRef<{ minutes: number; streak: number }>({ minutes: 0, streak: 0 });
  const announceRef = useRef<HTMLDivElement | null>(null);

  const { todayMinutes, pct, streak } = useMemo(() => {
    const todayStr = new Date().toDateString();
    const focusSeconds = sessions
      .filter(s => s.mode === 'focus' && s.endedAt && new Date(s.startedAt).toDateString() === todayStr)
      .reduce((a, b) => a + b.durationSec, 0);
    const todayMinutes = Math.round(focusSeconds / 60);
    const pct = Math.min(100, (todayMinutes / goalMinutes) * 100);
    // Build map of dateString -> minutes
    const dayMap = new Map<string, number>();
    sessions.forEach(s => {
      if (s.mode !== 'focus' || !s.endedAt) return;
      const d = new Date(s.startedAt).toDateString();
      const prev = dayMap.get(d) || 0;
      dayMap.set(d, prev + Math.round(s.durationSec / 60));
    });
    // Compute streak (consecutive days up to today meeting goal)
    let streak = 0;
    if (goalMinutes > 0) {
      const cursor = new Date();
      // Normalize to start of today for loop
      for (let i = 0; i < 365; i++) { // cap to 1 year to avoid infinite loop
        const key = cursor.toDateString();
        const mins = dayMap.get(key) || 0;
        if (mins >= goalMinutes) {
          streak += 1;
          cursor.setDate(cursor.getDate() - 1); // move to previous day
          continue;
        }
        break;
      }
    }
    return { todayMinutes, pct, streak };
  }, [sessions, goalMinutes]);

  // Announce when goal achieved or streak increases
  useEffect(() => {
    const prev = prevRef.current;
    let message: string | null = null;
    if (goalMinutes > 0 && prev.minutes < goalMinutes && todayMinutes >= goalMinutes) {
      message = `Daily focus goal reached: ${todayMinutes} minutes`;
    } else if (streak > prev.streak) {
      message = `Focus streak extended to ${streak} days`;
    }
    if (message && announceRef.current) {
      announceRef.current.textContent = message;
    }
    prevRef.current = { minutes: todayMinutes, streak };
  }, [todayMinutes, streak, goalMinutes]);

  return (
  <div className="card" style={{padding:'0.9rem 1rem', display:'flex', flexDirection:'column', gap:'0.55rem'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', flexWrap:'wrap', gap:'.5rem'}}>
        <span style={{fontSize:'.7rem', letterSpacing:'.12em', textTransform:'uppercase', color:'var(--text-muted)'}}>Daily Focus Goal</span>
        <span style={{display:'flex', alignItems:'center', gap:'.65rem'}}>
          <span style={{fontSize:'.7rem'}}>{todayMinutes} / {goalMinutes}m</span>
          {goalMinutes > 0 && (
            <span style={{fontSize:'.6rem', background:'var(--surface-2)', padding:'.25rem .5rem', borderRadius:'1rem', display:'inline-flex', alignItems:'center', gap:'.3rem'}} aria-label={`Streak ${streak} day${streak===1?'':'s'}`}>
              <span role="img" aria-hidden="true">🔥</span>
              {streak}d
            </span>
          )}
        </span>
      </div>
      <div style={{position:'relative', height:8, background:'var(--surface-2)', borderRadius:4, overflow:'hidden'}} aria-label="Daily focus progress" role="progressbar" aria-valuemin={0} aria-valuemax={goalMinutes || 0} aria-valuenow={todayMinutes}>
        <div style={{position:'absolute', inset:0, background:'linear-gradient(90deg,var(--accent) 0%, var(--accent-alt) 100%)', width:`${pct}%`, transition:'width .4s'}} />
        {pct >= 100 && <div style={{position:'absolute', inset:0, background:'linear-gradient(45deg,#fff3 0%,transparent 60%)', mixBlendMode:'overlay', pointerEvents:'none'}} />}
      </div>
      <div ref={announceRef} aria-live="polite" style={{position:'absolute', width:1, height:1, padding:0, margin:-1, overflow:'hidden', clip:'rect(0 0 0 0)', whiteSpace:'nowrap', border:0}} />
    </div>
  );
};

export default FocusGoalBar;
