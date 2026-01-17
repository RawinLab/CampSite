/**
 * Error Logging Service
 * Centralizes error logging and reporting
 */

interface ErrorContext {
  componentStack?: string;
  url?: string;
  userId?: string;
  sessionId?: string;
  additionalInfo?: Record<string, unknown>;
}

interface LoggedError {
  message: string;
  stack?: string;
  context: ErrorContext;
  timestamp: string;
  url: string;
  userAgent: string;
}

/**
 * Log an error to the console and error tracking service
 */
export function logError(error: Error, context?: ErrorContext): void {
  const errorData: LoggedError = {
    message: error.message,
    stack: error.stack,
    context: {
      ...context,
      url: typeof window !== 'undefined' ? window.location.href : 'server',
    },
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : 'server',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
  };

  // Always log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error Logger]', errorData);
  }

  // Send to error tracking service in production
  if (process.env.NODE_ENV === 'production') {
    sendToErrorService(errorData);
  }
}

/**
 * Log a warning (non-critical issue)
 */
export function logWarning(message: string, context?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Warning]', message, context);
  }

  // Optionally send warnings to error service
  // sendToErrorService({ type: 'warning', message, context });
}

/**
 * Log an info message (for debugging/monitoring)
 */
export function logInfo(message: string, context?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'development') {
    console.info('[Info]', message, context);
  }
}

/**
 * Send error data to external error tracking service
 */
async function sendToErrorService(errorData: LoggedError): Promise<void> {
  const errorEndpoint = process.env.NEXT_PUBLIC_ERROR_ENDPOINT;

  if (!errorEndpoint) {
    return;
  }

  try {
    // Use sendBeacon for reliability on page unload
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(errorEndpoint, JSON.stringify(errorData));
    } else {
      // Fallback to fetch
      await fetch(errorEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData),
        keepalive: true,
      });
    }
  } catch (e) {
    // Silently fail - don't throw errors from error logging
    console.error('Failed to send error to tracking service', e);
  }
}

/**
 * Create an error with additional context
 */
export function createError(
  message: string,
  code?: string,
  context?: Record<string, unknown>
): Error {
  const error = new Error(message);
  (error as Error & { code?: string; context?: Record<string, unknown> }).code = code;
  (error as Error & { context?: Record<string, unknown> }).context = context;
  return error;
}

/**
 * Wrap an async function with error logging
 */
export function withErrorLogging<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context?: ErrorContext
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof Error) {
        logError(error, context);
      } else {
        logError(new Error(String(error)), context);
      }
      throw error;
    }
  }) as T;
}

/**
 * Global error handler setup for unhandled errors
 */
export function setupGlobalErrorHandler(): void {
  if (typeof window === 'undefined') return;

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error =
      event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));

    logError(error, {
      additionalInfo: { type: 'unhandledRejection' },
    });
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    logError(event.error || new Error(event.message), {
      additionalInfo: {
        type: 'globalError',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });
}

/**
 * Initialize error logging (call once in app entry)
 */
export function initErrorLogging(): void {
  setupGlobalErrorHandler();

  // Future: Initialize Sentry or other error tracking service
  // if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  //   Sentry.init({
  //     dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  //     environment: process.env.NODE_ENV,
  //   });
  // }
}
