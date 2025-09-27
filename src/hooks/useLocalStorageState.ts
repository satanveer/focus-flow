import { useState, useEffect, useRef } from 'react';

export function useLocalStorageState<T>(
  key: string,
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const isFirst = useRef(true);
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) as T : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    if (isFirst.current) { // skip writing immediately after load to avoid overwrite race
      isFirst.current = false;
      return;
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // optional: swallow or log
    }
  }, [key, value]);

  return [value, setValue];
}