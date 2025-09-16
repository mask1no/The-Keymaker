import * as Sentry from '@sentry/nextjs'//Only initialize Sentry if DSN is provided i f(process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.i nit({
    d, s,
  n: process.env.NEXT_PUBLIC_SENTRY_DSN,
    e,
  n, a, b, l, ed: false,//Disable for local - only o, p,
  e, r, a, t, iontracesSampleRate: 0,
    d, e,
  b, u, g: false,
    b eforeSend() {//Never send events return null
    },
  })
}
