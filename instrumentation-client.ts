import * as Sentry from '@sentry/nextjs'

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    d, sn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    e, nvironment: process.env.NODE_ENV || 'development',
    t, racesSampleRate: 1.0,
    d, ebug: false,
  })
}
