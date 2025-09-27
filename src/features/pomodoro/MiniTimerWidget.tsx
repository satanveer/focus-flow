import { usePomodoro } from './PomodoroContext';
import React from 'react';
import { Link } from 'react-router-dom';

function format(seconds: number) {
  const m = Math.floor(seconds / 60).toString();
  const s = Math.floor(seconds % 60).toString().padStart(2,'0');
  return `${m}:${s}`;
}

export const MiniTimerWidget: React.FC = () => {
  const { active, getRemaining } = usePomodoro();
  if (!active) return null;
  const remaining = getRemaining();
  const label = active.mode === 'focus' ? 'Focus' : active.mode === 'shortBreak' ? 'Short' : 'Long';
  const color = active.mode === 'focus' ? 'var(--accent)' : active.mode === 'shortBreak' ? 'var(--warning)' : 'var(--info)';
  return (
    <Link to="/timer" className="flex items-center gap-1 text-xs px-2 py-1 rounded-full" style={{background:'var(--surface-2)', color:'var(--text)'}} aria-label="Active timer">
      <span style={{display:'inline-block', width:6, height:6, borderRadius:'50%', background:color}} />
      <span>{label}</span>
      <strong style={{fontVariantNumeric:'tabular-nums'}}>{format(remaining)}</strong>
    </Link>
  );
};

export default MiniTimerWidget;