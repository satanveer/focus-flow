import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { TaskFocusBinder } from "../features/pomodoro/TaskFocusBinder";
import { MiniTimerWidget } from "../features/pomodoro/MiniTimerWidget";

export default function Layout() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { logout } = useAuth();
  const location = useLocation();

  const links = [
    { to: '/', label: 'Dashboard', end: true },
    { to: '/tasks', label: 'Tasks' },
    { to: '/timer', label: 'Timer' },
    { to: '/notes', label: 'Notes' },
    { to: '/insights', label: 'Insights' },
    { to: '/settings', label: 'Settings' }
  ];
  const [navOpen, setNavOpen] = useState(false);

  // (Previously had a moving background indicator; removed due to visual overlap creating double "bubble" effect.)
  useEffect(() => {
    // Update document title with current page context.
    const active = links.find(l => (l.end ? location.pathname === l.to : location.pathname.startsWith(l.to)))?.label || '';
    document.title = active ? `BobbyFlow • ${active}` : 'BobbyFlow';
  }, [location.pathname]);

  return (
    <div style={{minHeight:'100dvh', display:'flex', flexDirection:'column'}}>
      <nav style={{position:'sticky', top:0, zIndex:50, padding:'0.75rem', paddingBottom:0}}>
        <div style={{position:'relative', borderRadius:'1rem', border:'1px solid var(--border)', background:'color-mix(in srgb, var(--bg-alt) 65%, transparent)', backdropFilter:'blur(12px)', boxShadow:'var(--shadow-md)'}}>
          <div style={{display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.75rem', minHeight:'3rem', position:'relative'}}>
            <button
              style={{
                marginRight:'0.25rem',
                fontSize:'0.8rem',
                fontWeight:'bold',
                padding:'0.5rem',
                borderRadius:'0.5rem',
                border:'1px solid var(--border)',
                background:'color-mix(in srgb, var(--bg) 50%, transparent)',
                transition:'background 0.2s',
                cursor:'pointer'
              }}
              className="mobile-nav-toggle"
              aria-label={navOpen? 'Close navigation':'Open navigation'}
              onClick={()=> setNavOpen(o=> !o)}
            >
              {navOpen? '✕':'☰'}
            </button>
            <div style={{display:'flex', alignItems:'center', paddingRight:'0.5rem', marginRight:'0.25rem', borderRight:'1px solid color-mix(in srgb, var(--border) 60%, transparent)', userSelect:'none'}}>
              <span style={{fontSize:'0.8rem', fontWeight:'800', letterSpacing:'0.05em', background:'linear-gradient(to right, var(--accent), var(--accent-accent2), var(--accent-accent3))', WebkitBackgroundClip:'text', backgroundClip:'text', color:'transparent'}}>BobbyFlow</span>
            </div>
            <div style={{alignItems:'center', gap:'0.25rem', flexWrap:'wrap', overflowX:'auto'}} className="desktop-nav">
              {links.map((l) => {
                const isActive = l.end ? location.pathname === l.to : location.pathname.startsWith(l.to);
                return (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end as any}
                  onClick={()=> setNavOpen(false)}
                  style={{
                    position:'relative',
                    padding:'0.5rem 1rem',
                    fontSize:'0.65rem',
                    fontWeight:'600',
                    letterSpacing:'0.025em',
                    borderRadius:'0.75rem',
                    whiteSpace:'nowrap',
                    userSelect:'none',
                    textDecoration:'none',
                    transition:'color 0.2s',
                    color: isActive ? 'var(--accent-foreground)' : 'var(--text-muted)'
                  }}
                  className="nav-link"
                  data-active={isActive ? 'true':'false'}
                >
                  <span
                    style={{
                      position:'absolute',
                      inset:0,
                      borderRadius:'0.75rem',
                      zIndex:-1,
                      overflow:'hidden',
                      background:'linear-gradient(to right, color-mix(in srgb, var(--accent) 95%, transparent), color-mix(in srgb, var(--accent) 70%, transparent))',
                      opacity: isActive ? 1 : 0,
                      transform: isActive ? 'scale(1)' : 'scale(0.75)',
                      transition:'all 0.4s ease-out'
                    }}
                    data-active={isActive ? 'true':'false'}
                  />
                  <span
                    style={{
                      position:'absolute',
                      inset:0,
                      zIndex:-1,
                      borderRadius:'0.75rem',
                      border:'1px solid transparent',
                      borderColor: isActive ? 'color-mix(in srgb, white 25%, transparent)' : 'transparent',
                      transition:'border-color 0.3s'
                    }}
                    data-active={isActive ? 'true':'false'}
                  />
                  <span style={{position:'relative', zIndex:10, letterSpacing:'0.025em'}}>{l.label}</span>
                </NavLink>
                );
              })}
            </div>
            <div style={{marginLeft:'auto', display:'flex', alignItems:'center', gap:'0.5rem', paddingLeft:'0.5rem'}}>
              <MiniTimerWidget />
              <button
                style={{
                  fontSize:'0.6rem',
                  fontWeight:'500',
                  padding:'0.375rem 0.625rem',
                  borderRadius:'0.5rem',
                  border:'1px solid color-mix(in srgb, var(--border) 70%, transparent)',
                  background:'color-mix(in srgb, var(--bg) 40%, transparent)',
                  transition:'background 0.2s',
                  cursor:'pointer'
                }}
                onClick={() => {
                  if (theme === 'system') {
                    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
                  } else {
                    setTheme(theme === 'dark' ? 'light' : 'dark');
                  }
                }}
              >
                {resolvedTheme === 'dark' ? 'Light' : 'Dark'}
              </button>
              <button
                style={{
                  fontSize:'0.6rem',
                  fontWeight:'500',
                  padding:'0.375rem 0.625rem',
                  borderRadius:'0.5rem',
                  border:'1px solid color-mix(in srgb, var(--danger) 70%, transparent)',
                  background:'color-mix(in srgb, var(--danger) 10%, transparent)',
                  color:'var(--danger)',
                  transition:'all 0.2s',
                  cursor:'pointer'
                }}
                onClick={() => logout()}
                title="Sign out"
              >
                Logout
              </button>
            </div>
          </div>
          {/* Mobile slide-down menu */}
          {navOpen && (
            <div 
              style={{
                borderTop:'1px solid var(--border)', 
                padding:'0 0.75rem 0.75rem',
                display: 'block'
              }} 
              className="mobile-menu"
            >
              <div style={{display:'flex', flexDirection:'column', paddingTop:'0.5rem', gap:'0.25rem'}}>
                {links.map(l => {
                  const isActive = l.end ? location.pathname === l.to : location.pathname.startsWith(l.to);
                  return (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.end as any}
                    onClick={()=> setNavOpen(false)}
                    style={{
                      position:'relative',
                      padding:'0.5rem 0.75rem',
                      borderRadius:'0.5rem',
                      fontSize:'0.7rem',
                      fontWeight:'500',
                      letterSpacing:'0.025em',
                      textDecoration:'none',
                      background: isActive ? 'var(--accent)' : 'transparent',
                      color: isActive ? 'var(--accent-foreground)' : 'var(--text-muted)',
                      transition:'all 0.2s'
                    }}
                  >{l.label}</NavLink>
                  );
                })}
                {/* Mobile logout button */}
                <button
                  onClick={() => {
                    setNavOpen(false);
                    logout();
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding:'0.5rem 0.75rem',
                    borderRadius:'0.5rem',
                    fontSize:'0.7rem',
                    fontWeight:'500',
                    letterSpacing:'0.025em',
                    background: 'transparent',
                    color: 'var(--danger)',
                    border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)',
                    marginTop: '0.5rem',
                    cursor: 'pointer',
                    transition:'all 0.2s'
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          )}
          <div style={{pointerEvents:'none', position:'absolute', left:0, right:0, bottom:'-1.5rem', height:'1.5rem', background:'linear-gradient(to bottom, color-mix(in srgb, black 10%, transparent), transparent)', opacity:0.4}} />
        </div>
      </nav>
      <main style={{flex:1, padding:'1rem'}}>
        <TaskFocusBinder />
        <Outlet />
      </main>
    </div>
  );
}
