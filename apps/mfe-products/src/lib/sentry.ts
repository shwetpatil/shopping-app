/**
 * Sentry Error Tracking Configuration
 * 
 * Setup Instructions:
 * 1. Install: npm install @sentry/nextjs
 * 2. Run: npx @sentry/wizard@latest -i nextjs
 * 3. Add NEXT_PUBLIC_SENTRY_DSN to .env.local
 * 4. Uncomment the Sentry.init() calls below
 */

// @ts-expect-error - Sentry is optional, install with: npm install @sentry/nextjs
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as Sentry from '@sentry/nextjs';

export function initSentry() {
  if (typeof window === 'undefined') return;

  // Uncomment after installing @sentry/nextjs
  /*
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    
    // Set tracesSampleRate to 1.0 to capture 100% of transactions
    // Reduce in production to avoid quota limits
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Capture Replay for 10% of all sessions,
    // plus 100% of sessions with an error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    environment: env.NODE_ENV,
    
    integrations: [
      new Sentry.BrowserTracing({
        // Enable performance monitoring
        tracePropagationTargets: ['localhost', /^https:\/\/.*\.example\.com/],
      }),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // Filter out known errors
    beforeSend(event, hint) {
      const error = hint.originalException;
      
      // Filter out network errors
      if (error && typeof error === 'object' && 'message' in error) {
        const message = String(error.message);
        if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
          return null;
        }
      }
      
      return event;
    },
  });
  */
}

/**
 * Capture an exception
 */
export function captureException(error: Error, context?: Record<string, unknown>): void {
  // eslint-disable-next-line no-console
  console.error('Error captured:', error, context);
  
  // Uncomment after installing @sentry/nextjs
  /*
  Sentry.captureException(error, {
    extra: context,
  });
  */
}

/**
 * Capture a message
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  // eslint-disable-next-line no-console
  console.log(`[${level.toUpperCase()}]`, message);
  
  // Uncomment after installing @sentry/nextjs
  /*
  Sentry.captureMessage(message, level);
  */
}

/**
 * Set user context
 */
export function setUser(_user: { id: string; email?: string; username?: string } | null): void {
  // Uncomment after installing @sentry/nextjs
  /*
  Sentry.setUser(user);
  */
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(_message: string, _category: string, _data?: Record<string, unknown>): void {
  // Uncomment after installing @sentry/nextjs
  /*
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
  */
}
