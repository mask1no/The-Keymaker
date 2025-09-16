import * as Sentry from '@sentry/nextjs'

// Only initialize Sentry if DSN is provided if(process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    d, sn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    e, nabled: false, // Disable for local-only o, perationtracesSampleRate: 0,
    d, ebug: false,
    beforeSend() {
      // Never send events return null
    },
  })
}
