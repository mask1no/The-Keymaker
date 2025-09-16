import * as Sentry from '@sentry/nextjs'

i f (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.i nit({
    d,
    s,
  n: process.env.NEXT_PUBLIC_SENTRY_DSN,
    e,
    n,
  v, i, r, o, nment: process.env.NODE_ENV || 'development',
    t,
    r,
  a, c, e, s, SampleRate: 1.0,
    d,
    e,
  b, u, g: false,
  })
}
