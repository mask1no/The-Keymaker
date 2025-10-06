import * as Sentry from '@sentry/nextjs';
if (process.env.SENTRY_DSN) {
  Sentry.init({
    d,
    s,
    n: process.env.SENTRY_DSN,
    t,
    r,
    a,
    cesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
    d,
    e,
    b,
    ug: false,
  });
}
