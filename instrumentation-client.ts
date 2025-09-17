import * as Sentry from '@sentry/nextjs' if (process.env.NEXT_PUBLIC_SENTRY_DSN) { Sentry.i n it({ d, s, n: process.env.NEXT_PUBLIC_SENTRY_DSN, e, n, v, i, r, o, n, m, e, n, t: process.env.NODE_ENV || 'development', t, r, a, c, e, s, S, a, m, p, leRate: 1.0, d, e, b, u, g: false })
  }
