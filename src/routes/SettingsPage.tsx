import React, { useState } from 'react';
import { usePomodoro } from '../features/pomodoro/PomodoroContext';
import { useTheme } from '../context/ThemeContext';

export default function SettingsPage() {
  const {
    focusDurations,
    updateDurations,
    autoStartNext,
    toggleAutoStart,
    creditMode,
    updateCreditMode,
    longBreakEvery,
    updateLongBreakEvery,
    goalMinutes,
    updateGoal,
    enableSound,
    enableNotifications,
    toggleSound,
    toggleNotifications,
    sessions,
  } = usePomodoro() as any;
  const { theme, setTheme, resolvedTheme } = useTheme();

  const [confirmReset, setConfirmReset] = useState(false);

  const totalFocusMinutes = Math.round(sessions.filter((s: any)=> s.mode==='focus').reduce((a:number,b:any)=> a + b.durationSec,0)/60);

  return (
    <div className="ff-stack" style={{gap:'1.25rem'}}>
      <header className="ff-stack" style={{gap:'.25rem'}}>
        <h1 style={{fontSize:'1.25rem', fontWeight:600}}>Settings</h1>
        <p style={{fontSize:'.65rem', color:'var(--text-muted)'}}>Tune your focus experience. All changes are saved automatically.</p>
      </header>

      <section className="card ff-stack" style={{padding:'1rem', gap:'.75rem'}}>
        <h2 style={{fontSize:'.8rem', letterSpacing:'.1em', textTransform:'uppercase', color:'var(--text-muted)'}}>Appearance</h2>
        <div style={{display:'flex', flexDirection:'column', gap:'.4rem', maxWidth:'14rem'}}>
          <label style={{fontSize:'.6rem', fontWeight:500}}>Theme</label>
          <select value={theme} onChange={e=> setTheme(e.target.value as any)} style={selectStyle} aria-label="Theme mode">
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
          <p style={hintStyle}>Resolved: {resolvedTheme}</p>
        </div>
      </section>

      <section className="card ff-stack" style={{padding:'1rem', gap:'.75rem'}}>
        <h2 style={{fontSize:'.8rem', letterSpacing:'.1em', textTransform:'uppercase', color:'var(--text-muted)'}}>Durations</h2>
        <div className="ff-row" style={{flexWrap:'wrap', gap:'1rem'}}>
          <DurationInput label="Focus (minutes)" value={focusDurations.focus} onChange={v=> updateDurations({focus:v})} />
          <DurationInput label="Short Break" value={focusDurations.shortBreak} onChange={v=> updateDurations({shortBreak:v})} />
          <DurationInput label="Long Break" value={focusDurations.longBreak} onChange={v=> updateDurations({longBreak:v})} />
        </div>
        <p style={{fontSize:'.55rem', color:'var(--text-muted)'}}>Set default lengths for new sessions (custom sessions on the timer page can override focus length).</p>
      </section>

      <section className="card ff-stack" style={{padding:'1rem', gap:'.75rem'}}>
        <h2 style={{fontSize:'.8rem', letterSpacing:'.1em', textTransform:'uppercase', color:'var(--text-muted)'}}>Behavior</h2>
        <label style={labelStyle} className="chk" aria-label="Auto-start next session chain">
          <input type="checkbox" checked={autoStartNext} onChange={toggleAutoStart} />
          <span className="chk-box" aria-hidden="true" />
          <span>Auto-start next session in a chain</span>
        </label>
        <div style={{display:'flex', flexDirection:'column', gap:'.35rem'}}>
          <span style={{fontSize:'.6rem', fontWeight:500}}>Manual Completion Credit</span>
          <select value={creditMode} onChange={e=> updateCreditMode(e.target.value)} style={selectStyle}>
            <option value="full">Full planned focus duration</option>
            <option value="elapsed">Only elapsed focus time</option>
          </select>
          <p style={hintStyle}>{creditMode==='full' ? 'Completing early still credits full planned minutes.' : 'Completing early only credits time actually elapsed.'}</p>
        </div>
      </section>

      <section className="card ff-stack" style={{padding:'1rem', gap:'.75rem'}}>
        <h2 style={{fontSize:'.8rem', letterSpacing:'.1em', textTransform:'uppercase', color:'var(--text-muted)'}}>Break Cadence</h2>
        <label style={{display:'flex', flexDirection:'column', gap:'.4rem', maxWidth:'12rem'}}>
          <span style={{fontSize:'.6rem', fontWeight:500}}>Long break every</span>
          <input type="number" min={1} max={12} value={longBreakEvery} onChange={e=> updateLongBreakEvery(Number(e.target.value))} style={inputStyle} />
          <p style={hintStyle}>Focus sessions before each long break.</p>
        </label>
      </section>

      <section className="card ff-stack" style={{padding:'1rem', gap:'.75rem'}}>
        <h2 style={{fontSize:'.8rem', letterSpacing:'.1em', textTransform:'uppercase', color:'var(--text-muted)'}}>Daily Goal</h2>
        <label style={{display:'flex', flexDirection:'column', gap:'.4rem', maxWidth:'12rem'}}>
          <span style={{fontSize:'.6rem', fontWeight:500}}>Goal (minutes)</span>
          <input type="number" min={15} step={15} value={goalMinutes} onChange={e=> updateGoal(Number(e.target.value))} style={inputStyle} />
          <p style={hintStyle}>Used for progress bar & streak. {totalFocusMinutes} focus minutes logged total.</p>
        </label>
      </section>

      <section className="card ff-stack" style={{padding:'1rem', gap:'.75rem'}}>
        <h2 style={{fontSize:'.8rem', letterSpacing:'.1em', textTransform:'uppercase', color:'var(--text-muted)'}}>Alerts</h2>
        <label style={labelStyle} className="chk" aria-label="Sound on session end">
          <input type="checkbox" checked={enableSound} onChange={toggleSound} />
          <span className="chk-box" aria-hidden="true" />
          <span>Sound on session end</span>
        </label>
        <label style={labelStyle} className="chk" aria-label="Desktop notification on session end">
          <input type="checkbox" checked={enableNotifications} onChange={toggleNotifications} />
          <span className="chk-box" aria-hidden="true" />
          <span>Desktop notification on session end</span>
        </label>
        <div style={{display:'flex', flexWrap:'wrap', gap:'.5rem', marginTop:'.25rem'}}>
          <button
            type="button"
            className="btn subtle"
            style={{fontSize:'.55rem'}}
            onClick={() => {
              try {
                if (!enableSound) return; // respect toggle
                const AudioCtx: any = (window as any).AudioContext || (window as any).webkitAudioContext;
                if (!AudioCtx) return;
                const ctx = new AudioCtx();
                if (ctx.state === 'suspended') ctx.resume?.();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                const baseFreq = 880; // test tone
                osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
                gain.gain.setValueAtTime(0.0001, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.03);
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.0);
                osc.connect(gain).connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 1.05);
              } catch {}
            }}
            disabled={!enableSound}
            aria-disabled={!enableSound}
          >Play Sound</button>
          <button
            type="button"
            className="btn subtle"
            style={{fontSize:'.55rem'}}
            onClick={() => {
              try {
                if (!enableNotifications) return; // respect toggle
                if ('Notification' in window) {
                  if (Notification.permission === 'granted') {
                    new Notification('Test BobbyFlow Notification', { body: 'This is how session end alerts will look.' });
                  } else if (Notification.permission === 'default') {
                    Notification.requestPermission().then(p => { if (p === 'granted') new Notification('Permission Granted', { body: 'Notifications enabled.' }); });
                  }
                }
              } catch {}
            }}
            disabled={!enableNotifications}
            aria-disabled={!enableNotifications}
          >Test Notification</button>
        </div>
        <p style={hintStyle}>Notifications require permission from your browser / OS. Use the buttons to validate your settings.</p>
      </section>

      <section className="card ff-stack" style={{padding:'1rem', gap:'.75rem'}}>
        <h2 style={{fontSize:'.8rem', letterSpacing:'.1em', textTransform:'uppercase', color:'var(--text-muted)'}}>Data & Utilities</h2>
        <div style={{display:'flex', flexDirection:'column', gap:'.5rem', maxWidth:340}}>
          <button
            type="button"
            className={confirmReset? 'btn danger':'btn subtle'}
            style={{fontSize:'.6rem'}}
            onClick={()=>{
              if(!confirmReset){ setConfirmReset(true); setTimeout(()=> setConfirmReset(false), 4000); return; }
              try {
                localStorage.removeItem('ff/pomodoro');
                window.location.reload();
              } catch {}
            }}
          >{confirmReset? 'Confirm Reset (erases sessions)':'Reset Pomodoro Data'}</button>
          <p style={hintStyle}>Reset removes all session history & settings (tasks are unaffected).</p>
        </div>
      </section>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display:'flex', alignItems:'center', gap:'.5rem', fontSize:'.6rem', cursor:'pointer' };
const hintStyle: React.CSSProperties = { fontSize:'.5rem', color:'var(--text-muted)', margin:0 };
const inputStyle: React.CSSProperties = { width:'6rem' };
const selectStyle: React.CSSProperties = { fontSize:'.6rem', maxWidth:'18rem' };

interface DurationInputProps { label: string; value: number; onChange: (seconds: number)=> void; }
function DurationInput({ label, value, onChange }: DurationInputProps) {
  return (
    <label style={{display:'flex', flexDirection:'column', gap:'.35rem', fontSize:'.6rem'}}>
      <span style={{fontWeight:500}}>{label}</span>
      <input
        type="number"
        min={1}
        value={Math.round(value/60)}
        onChange={e=> onChange(Number(e.target.value)*60)}
        style={{width:'6rem'}}
      />
    </label>
  );
}