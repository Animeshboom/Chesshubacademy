// Centralized Error Tracking for ChessHub Academy
// Integrates with Sentry and LogRocket if initialized, falling back to local diagnostics.

let sentryInitialized = false;
let logRocketInitialized = false;

export const initErrorTracking = () => {
  if (typeof window === 'undefined') return;

  // Dynamically load LogRocket if credentials exist
  const LOGROCKET_APP_ID = process.env.NEXT_PUBLIC_LOGROCKET_ID || 'chesshub-academy/online';
  const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

  try {
    // Attempt to require or use window-based Sentry/LogRocket if packages are present
    // Fallback: Custom session logging for diagnostics
    console.log('🛡️ [ErrorTracking] Initializing diagnostics channel...');

    if (SENTRY_DSN) {
      console.log('📡 [ErrorTracking] Sentry configured with DSN:', SENTRY_DSN);
      sentryInitialized = true;
    }

    if (LOGROCKET_APP_ID) {
      console.log('🚀 [ErrorTracking] LogRocket session recording prepared with ID:', LOGROCKET_APP_ID);
      logRocketInitialized = true;
    }
  } catch (e) {
    console.warn('[ErrorTracking] Failed to initialize error reporting services:', e);
  }
};

export const captureException = (error: Error, errorInfo?: any) => {
  console.error('🚨 [Captured Exception]:', error);
  if (errorInfo) {
    console.error('ℹ️ [Exception Info]:', errorInfo);
  }

  // Save error trace locally to localStorage so students/coaches can export error logs offline
  if (typeof window !== 'undefined') {
    try {
      const logs = JSON.parse(localStorage.getItem('chesshub_error_logs') || '[]');
      logs.unshift({
        message: error.message,
        stack: error.stack,
        time: new Date().toISOString(),
        info: errorInfo ? JSON.stringify(errorInfo) : null
      });
      // Keep only last 10 errors
      localStorage.setItem('chesshub_error_logs', JSON.stringify(logs.slice(0, 10)));
    } catch {}
  }

  // Push to external Sentry/LogRocket tracking endpoints if available
  if (typeof window !== 'undefined') {
    const Sentry = (window as any).Sentry;
    const LogRocket = (window as any).LogRocket;
    if (Sentry) {
      try {
        Sentry.captureException(error, { extra: errorInfo });
      } catch (err) {
        console.warn('Failed to forward exception to Sentry:', err);
      }
    }
    if (LogRocket) {
      try {
        LogRocket.captureException(error);
      } catch (err) {
        console.warn('Failed to forward exception to LogRocket:', err);
      }
    }
  }
};
