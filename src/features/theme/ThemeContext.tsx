import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = 'ff.theme';

// (Reserved for potential future explicit variable maps)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved === 'light' || saved === 'dark') return saved;
    // default: dark (existing design baseline)
    return 'dark';
  });

  const apply = useCallback((t: Theme) => {
    const root = document.documentElement;
    root.dataset.theme = t;
    // Example minimal palette switch; you'd expand mapping for full color systems
    if (t === 'light') {
      root.style.setProperty('--bg', '#f5f7fa');
      root.style.setProperty('--text-primary', '#1a1d21');
      root.style.setProperty('--surface-1', '#ffffff');
      root.style.setProperty('--surface-2', '#eef1f5');
      root.style.setProperty('--border', '#d6dbe0');
    } else {
      root.style.removeProperty('--bg'); // fall back to existing CSS
      root.style.removeProperty('--text-primary');
      root.style.removeProperty('--surface-1');
      root.style.removeProperty('--surface-2');
      root.style.removeProperty('--border');
    }
  }, []);

  useEffect(() => { apply(theme); localStorage.setItem(STORAGE_KEY, theme); }, [theme, apply]);

  const setTheme = (t: Theme) => setThemeState(t);
  const toggleTheme = () => setThemeState(t => t === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
