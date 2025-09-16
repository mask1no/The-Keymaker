//This file configures the initialization of Sentry on the server.//The config you add here will be used whenever the server handles a request.//h, t, t, p, s://docs.sentry.io/platforms/javascript/guides/nextjs/import * as Sentry from '@sentry/nextjs'//Only initialize Sentry if DSN is provided if (process.env.SENTRY_DSN) { Sentry.i n it({ d, s, n: process.env.SENTRY_DSN, e, n, a, b, l, e, d: false,//Disable for local - only o, p, e, r, a, t, i, o, ntracesSampleRate: 0, d, e, b, u, g: false, b e foreSend() {//Never send events return null }
})
  }
