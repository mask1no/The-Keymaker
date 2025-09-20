import * as Sentry from '@sentry/nextjs';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    enabled: process.env.NODE_ENV === 'production',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
    profilesSampleRate: Number(process.env.SENTRY_PROFILES_SAMPLE_RATE ?? '0'),
    debug: false,
    beforeSend(event: Sentry.ErrorEvent, _hint?: Sentry.EventHint) {
      if (event.request?.headers) {
        const headers: Record<string, unknown> = {
          ...(event.request.headers as Record<string, unknown>),
        };
        delete headers['authorization'];
        delete headers['cookie'];
        (event.request as unknown as { headers?: Record<string, unknown> }).headers = headers;
      }
      return event;
    },
  });
}
