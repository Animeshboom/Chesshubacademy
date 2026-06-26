export function initTelemetry() {
  if (typeof window === 'undefined') return;

  const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  const logrocketAppId = process.env.NEXT_PUBLIC_LOGROCKET_APP_ID;

  if (sentryDsn) {
    try {
      // Hide from Turbopack static resolution using new Function()
      const importSentry = new Function('return import("@sentry/nextjs")');
      importSentry()
        .then((Sentry: any) => {
          Sentry.init({
            dsn: sentryDsn,
            tracesSampleRate: 1.0,
            replaysSessionSampleRate: 0.1,
            replaysOnErrorSampleRate: 1.0,
          });
          (window as any).Sentry = Sentry;
          console.log('Sentry telemetry initialized successfully');
        })
        .catch((err: any) => {
          console.warn('Sentry package load error:', err.message);
        });
    } catch (e) {
      console.warn('Could not initialize Sentry dynamic loader:', e);
    }
  }

  if (logrocketAppId) {
    try {
      const importLogRocket = new Function('return import("logrocket")');
      importLogRocket()
        .then((LogRocket: any) => {
          LogRocket.init(logrocketAppId);
          (window as any).LogRocket = LogRocket;
          console.log('LogRocket telemetry initialized successfully');
        })
        .catch((err: any) => {
          console.warn('LogRocket package load error:', err.message);
        });
    } catch (e) {
      console.warn('Could not initialize LogRocket dynamic loader:', e);
    }
  }
}
