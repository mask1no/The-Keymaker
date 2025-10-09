import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { probeHealth } from '@/lib/server/health';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest) {
  let bundleEnabled = false;
  let dbHealthy = false;

  // Check database health
  try {
    const db = await getDb();
    await db.exec(
      'CREATE TABLE IF NOT EXISTS ui_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)',
    );
    const r = await db.get('SELECT value FROM ui_settings WHERE key = ?', ['customFees']);
    bundleEnabled = !!(r?.value && JSON.parse(r.value)?.bundle?.enabled);
    dbHealthy = true;
  } catch (error) {
    // Database health check failed
    dbHealthy = false;
  }

  // Get real health status from health probe
  const healthStatus = await probeHealth();

  return new Response(
    JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        rpc: {
          status: healthStatus.rpc.light,
          latencyMs: healthStatus.rpc.latencyMs,
          endpoint: healthStatus.rpc.endpoint,
          message: healthStatus.rpc.message,
        },
        ws: {
          status: healthStatus.ws.light,
          lastHeartbeatAt: healthStatus.ws.lastHeartbeatAt,
          missed: healthStatus.ws.missed,
          message: healthStatus.ws.message,
        },
        slot: {
          status: healthStatus.sm.light,
          current: healthStatus.sm.slot,
          delta: healthStatus.sm.slotDelta,
          message: healthStatus.sm.message,
        },
        jito: {
          status: healthStatus.jito.light,
          tipFloor: healthStatus.jito.tipFloor,
          message: healthStatus.jito.message,
        },
        database: {
          status: dbHealthy ? 'ok' : 'down',
          message: dbHealthy ? undefined : 'database connection failed',
        },
      },
      bundle: { enabled: bundleEnabled },
      overall:
        healthStatus.rpc.light === 'green' && healthStatus.sm.light === 'green' && dbHealthy
          ? 'healthy'
          : 'degraded',
    }),
    { status: 200, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } },
  );
}
