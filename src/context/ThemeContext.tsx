import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type Resolved = 'light' | 'dark';

interface ThemeCtx {
  theme: Theme;
  resolvedTheme: Resolved;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeCtx | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Load theme from localStorage on init
    const saved = localStorage.getItem('theme');
    return (saved === 'light' || saved === 'dark' || saved === 'system') ? saved : 'system';
  });

  const resolvedTheme: Resolved = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Apply on every resolvedTheme change
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', resolvedTheme);
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    console.log('🎨 Theme changed to:', resolvedTheme, 'Dark class:', root.classList.contains('dark'));
  }, [resolvedTheme]);

  // Listen to system changes only when theme === 'system'
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const next = mq.matches ? 'dark' : 'light';
      const root = document.documentElement;
      root.setAttribute('data-theme', next);
      if (next === 'dark') root.classList.add('dark');
      else root.classList.remove('dark');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}