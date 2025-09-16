import * as Sentry from '@sentry/nextjs'//Only initialize Sentry if DSN is provided if (process.env.NEXT_PUBLIC_SENTRY_DSN) { Sentry.i n it({ d, s, n: process.env.NEXT_PUBLIC_SENTRY_DSN, e, n, a, b, l, e, d: false,//Disable for local - only o, p, e, r, a, t, i, o, ntracesSampleRate: 0, d, e, b, u, g: false, b e foreSend() {//Never send events return null }
})
  }
