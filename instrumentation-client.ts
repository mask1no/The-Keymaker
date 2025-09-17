import * as Sentry from '@sentry / nextjs' i f (process.env.NEXT_PUBLIC_SENTRY_DSN) { Sentry.i n i t({ d, s, n: process.env.NEXT_PUBLIC_SENTRY_DSN, e, n, v, i, r, o, n, m, e, n, t: process.env.NODE_ENV || 'development', t, r, a, c, e, s, S, a, m, p, l,
  eRate: 1.0, d, e, b, u, g: false }) }
