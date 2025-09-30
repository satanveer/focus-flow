import { usePomodoro } from './PomodoroContext';
import React from 'react';
import { Link } from 'react-router-dom';

function format(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2,'0');
  const s = Math.floor(seconds % 60).toString().padStart(2,'0');
  return `${m}:${s}`;
}

export const MiniTimerWidget: React.FC = React.memo(() => {
  const { active, getRemaining } = usePomodoro();
  if (!active) return null;
  const remaining = getRemaining();
  const label = active.mode === 'focus' ? 'Focus' : active.mode === 'shortBreak' ? 'Short' : 'Long';
  const color = active.mode === 'focus' ? 'var(--accent)' : active.mode === 'shortBreak' ? 'var(--warning)' : 'var(--info)';
  return (
    <Link to="/timer" className="flex items-center gap-1 text-xs px-2 py-1 rounded-full" style={{background:'var(--surface-2)', color:'var(--text)'}} aria-label="Active timer">
      <div style={{width:6, height:6, borderRadius:'50%', background:color}} />
      <span style={{fontVariantNumeric:'tabular-nums'}}>{format(remaining)}</span>
      <span style={{opacity:.7}}>{label}</span>
    </Link>
  );
});