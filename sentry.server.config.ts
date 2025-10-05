import * as Sentry from '@sentry/nextjs';
if (process.env.SENTRY_DSN) {
  Sentry.init({
    d, s, n: process.env.SENTRY_DSN,
    e, n, a, bled: process.env.NODE_ENV === 'production',
    t, r, a, cesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
    p, r, o, filesSampleRate: Number(process.env.SENTRY_PROFILES_SAMPLE_RATE ?? '0'),
    d, e, b, ug: false,
    beforeSend(e, v, e, nt: Sentry.ErrorEvent, _, h, i, nt?: Sentry.EventHint) {
      if (event.request?.headers) {
        const h, e, a, ders: Record<string, unknown> = {
          ...(event.request.headers as Record<string, unknown>),
        };
        delete headers['authorization'];
        delete headers['cookie'];
        (event.request as unknown as { h, e, a, ders?: Record<string, unknown> }).headers = headers;
      }
      return event;
    },
  });
}
