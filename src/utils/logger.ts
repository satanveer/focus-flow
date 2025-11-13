/**
 * Production-safe logger utility
 * Logs are only shown in development or based on LOG_LEVEL env var
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL = (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'info';
const IS_DEV = import.meta.env.DEV;

const levels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function shouldLog(level: LogLevel): boolean {
  if (IS_DEV) return true;
  return levels[level] >= levels[LOG_LEVEL];
}

export const logger = {
  debug: (...args: any[]) => {
    if (shouldLog('debug')) {
      console.log('[DEBUG]', ...args);
    }
  },
  
  info: (...args: any[]) => {
    if (shouldLog('info')) {
      console.log('[INFO]', ...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (shouldLog('warn')) {
      console.warn('[WARN]', ...args);
    }
  },
  
  error: (...args: any[]) => {
    if (shouldLog('error')) {
      console.error('[ERROR]', ...args);
    }
  },
  
  // Special method for sync/calendar operations
  sync: (...args: any[]) => {
    if (IS_DEV) {
      console.log('🔄 [SYNC]', ...args);
    }
  },
  
  // Special method for authentication operations
  auth: (...args: any[]) => {
    if (IS_DEV) {
      console.log('🔐 [AUTH]', ...args);
    }
  },
};

export default logger;
