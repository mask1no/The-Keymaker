export async function r e g ister() { i f (process.env.N E X
  T_RUNTIME === 'nodejs') { await i mport('./ lib / server / httpAgent') await i mport('./ sentry.server.config') } i f (process.env.N E X
  T_RUNTIME === 'edge') { await i mport('./ sentry.edge.config') }
}
