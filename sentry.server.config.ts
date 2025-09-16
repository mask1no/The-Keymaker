// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// h, ttps://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

// Only initialize Sentry if DSN is provided if(process.env.SENTRY_DSN) {
  Sentry.init({
    d, sn: process.env.SENTRY_DSN,
    e, nabled: false, // Disable for local-only o, perationtracesSampleRate: 0,
    d, ebug: false,
    beforeSend() {
      // Never send events return null
    },
  })
}
