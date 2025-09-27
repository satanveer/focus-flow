import { NavLink, Outlet } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { TaskFocusBinder } from "../features/pomodoro/TaskFocusBinder";
import { MiniTimerWidget } from "../features/pomodoro/MiniTimerWidget";

export default function Layout() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <div className="min-h-dvh flex flex-col">
      <nav className="p-2">
        <ul className="flex flex-wrap gap-2 justify-between bg-[var(--bg-alt)] text-[var(--text)] border border-[var(--border)] rounded-full px-4 py-2 shadow-sm">
          <div className="flex w-3/4 gap-20">
          <li><NavLink to="/" end>Dashboard</NavLink></li>
          <li><NavLink to="/tasks">Tasks</NavLink></li>
          <li><NavLink to="/habits">Habits</NavLink></li>
          <li><NavLink to="/timer">Timer</NavLink></li>
          <li><NavLink to="/notes">Notes</NavLink></li>
            <li><NavLink to="/insights">Insights</NavLink></li>
          <li><NavLink to="/settings">Settings</NavLink></li>
          </div>
          <li className="flex items-center gap-2">
            <MiniTimerWidget />
            <button
              className="text-xs px-2 py-1 rounded border border-[var(--border)] hover:bg-[var(--bg)] transition"
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
            
          </li>
        </ul>
      </nav>
      <main className="flex-1 p-4">
        <TaskFocusBinder />
        <Outlet />
      </main>
    </div>
  );
}
