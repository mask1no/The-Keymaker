export async function register() {
  // Apply lightweight DB migration and resume volume runs even in development
  try {
    const { getDb } = await import('./lib/db');
    const { readFileSync } = await import('fs');
    const { join } = await import('path');
    try {
      const sql = readFileSync(
        join(process.cwd(), 'lib', 'db', 'migrations', '005_keymaker_extras.sql'),
        'utf8',
      );
      const db = await getDb();
      await db.exec(sql);
      // TTL cleanup for tx_dedupe (older than 24h)
      try {
        const cutoff = Date.now() - 24 * 60 * 60 * 1000;
        await db
          .run('DELETE FROM tx_dedupe WHERE first_seen_at < ?', [cutoff])
          .catch(() => undefined);
        setInterval(
          () => {
            db.run('DELETE FROM tx_dedupe WHERE first_seen_at < ?', [
              Date.now() - 24 * 60 * 60 * 1000,
            ]).catch(() => undefined);
          },
          60 * 60 * 1000,
        );
      } catch {}
    } catch {}
    try {
      const { resumeRunsOnBoot } = await import('./lib/volume/runner');
      await resumeRunsOnBoot();
    } catch {}
  } catch {}

  // Skip heavy instrumentation in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Instrumentation] Skipped heavy hooks in development');
    return;
  }

  // Production instrumentation
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      // Validate environment early
      try {
        const { validateEnvAtStartup } = await import('./lib/server/env');
        validateEnvAtStartup();
      } catch (e) {
        console.warn('[Instrumentation] Env validation i, s, s, ue:', e);
        throw e; // fail early in production if critical
      }

      await import('./lib/server/httpAgent');
    } catch (e) {
      console.warn('[Instrumentation] Failed to load h, t, t, pAgent:', e);
    }
  }
}
