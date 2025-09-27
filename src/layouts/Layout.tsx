import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { TaskFocusBinder } from "../features/pomodoro/TaskFocusBinder";
import { MiniTimerWidget } from "../features/pomodoro/MiniTimerWidget";

export default function Layout() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const location = useLocation();

  const links = [
    { to: '/', label: 'Dashboard', end: true },
    { to: '/tasks', label: 'Tasks' },
    { to: '/timer', label: 'Timer' },
    { to: '/notes', label: 'Notes' },
    { to: '/insights', label: 'Insights' },
    { to: '/settings', label: 'Settings' }
  ];

  // (Previously had a moving background indicator; removed due to visual overlap creating double "bubble" effect.)
  useEffect(() => {
    // Could add future responsive behaviors here if needed.
  }, [location.pathname]);

  return (
    <div className="min-h-dvh flex flex-col">
      <nav className="sticky top-0 z-50 px-4 pt-4">
        <div className="relative rounded-3xl border border-[var(--border)] bg-[color:var(--bg-alt)/0.55] backdrop-blur-xl supports-[backdrop-filter]:bg-[color:var(--bg-alt)/0.5] shadow-md ring-1 ring-black/5 dark:ring-white/10">
          <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto scrollbar-none min-h-[3.25rem] [&_a]:no-underline [&_a:hover]:no-underline [&_a:visited]:no-underline" style={{position:'relative'}}>
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end as any}
                className={({isActive}) => [
                  'group relative px-5 py-2.5 text-[0.7rem] font-semibold tracking-wide rounded-2xl whitespace-nowrap select-none no-underline',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
                  'transition-colors duration-200',
                  isActive
                    ? 'text-[var(--accent-foreground)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                ].join(' ')}
                data-active={location.pathname === l.to ? 'true':'false'}
              >
                {/* Animated background bubble */}
                <span
                  aria-hidden
                  className={[
                    'absolute inset-0 rounded-2xl -z-10 overflow-hidden',
                    'before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-r before:from-[var(--accent)]/95 before:to-[var(--accent)]/70',
                    'before:opacity-0 before:scale-75 before:blur-[1px] before:transition-all before:duration-400 before:ease-out',
                    'group-hover:before:opacity-60 group-hover:before:scale-100 group-hover:before:blur-0',
                    '[&[data-active=true]::before]:opacity-100 [&[data-active=true]::before]:scale-100',
                    'motion-reduce:before:transition-none'
                  ].join(' ')}
                  data-active={location.pathname === l.to ? 'true':'false'}
                />
                {/* Inner subtle surface for active (adds slight elevation) */}
                <span
                  aria-hidden
                  className={[
                    'absolute inset-0 -z-10 rounded-2xl border border-transparent transition-colors duration-300',
                    '[&[data-active=true]]:border-white/25 dark:[&[data-active=true]]:border-white/15',
                    'group-hover:border-[var(--border)]/40'
                  ].join(' ')}
                  data-active={location.pathname === l.to ? 'true':'false'}
                />
                <span className="relative z-10 tracking-wide">{l.label}</span>
              </NavLink>
            ))}
            <div className="ml-auto flex items-center gap-3 pl-4">
              <MiniTimerWidget />
              <button
                className="text-[0.65rem] font-medium px-2.5 py-1.5 rounded-xl border border-[var(--border)]/70 bg-[var(--bg)]/40 hover:bg-[var(--bg)]/70 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/70"
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
            </div>
          </div>
          {/* subtle bottom gradient + shadow for separation */}
          <div className="pointer-events-none absolute inset-x-0 -bottom-6 h-6 bg-gradient-to-b from-black/10 dark:from-white/5 to-transparent opacity-40" />
        </div>
      </nav>
      <main className="flex-1 p-4">
        <TaskFocusBinder />
        <Outlet />
      </main>
    </div>
  );
}
