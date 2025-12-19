// Client-side logger utility
// In production, these logs will be suppressed

const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log('[LOG]', ...args);
    }
  },
  info: (...args) => {
    if (isDevelopment) {
      console.info('[INFO]', ...args);
    }
  },
  warn: (...args) => {
    // Warnings are shown in all environments
    console.warn('[WARN]', ...args);
  },
  error: (...args) => {
    // Errors are shown in all environments
    console.error('[ERROR]', ...args);
  },
  debug: (...args) => {
    if (isDevelopment) {
      console.debug('[DEBUG]', ...args);
    }
  }
};

export default logger;
