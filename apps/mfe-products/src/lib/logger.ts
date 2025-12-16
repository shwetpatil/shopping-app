/**
 * Centralized logger utility for production-safe logging
 */

interface Logger {
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
  debug: (message: string, ...args: unknown[]) => void;
}

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Logger that only outputs in development
 * In production, errors are sent to monitoring service
 */
export const logger: Logger = {
  info: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },

  warn: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },

  error: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.error(`[ERROR] ${message}`, ...args);
    } else if (isProduction) {
      // TODO: Send to error monitoring service (Sentry, DataDog, etc.)
      // errorMonitoring.captureException(new Error(message), { extra: args });
    }
  },

  debug: (message: string, ...args: unknown[]) => {
    if (isDevelopment && process.env.NEXT_PUBLIC_DEBUG === 'true') {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
};

/**
 * Performance monitoring wrapper
 */
export const perfLogger = {
  start: (label: string): (() => void) => {
    if (!isDevelopment) return () => {};
    
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      logger.debug(`${label} took ${duration.toFixed(2)}ms`);
    };
  },
};
