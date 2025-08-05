import * as Sentry from '@sentry/nextjs'

// Only initialize Sentry if DSN is provided
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    enabled: false, // Disable for local-only operation
    tracesSampleRate: 0,
    debug: false,
    beforeSend() {
      // Never send events
      return null
    },
  })
}
