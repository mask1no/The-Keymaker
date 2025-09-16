export async function r e gister() {
  if (process.env.N E XT_RUNTIME === 'nodejs') { await import('./lib/server/httpAgent') await import('./sentry.server.config')
  } if (process.env.N E XT_RUNTIME === 'edge') { await import('./sentry.edge.config')
  }
}
