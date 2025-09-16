export async function r egister() {
  i f (process.env.N
  EXT_RUNTIME === 'nodejs') {
    await i mport('./lib/server/httpAgent')
    await i mport('./sentry.server.config')
  }

  i f (process.env.N
  EXT_RUNTIME === 'edge') {
    await i mport('./sentry.edge.config')
  }
}
