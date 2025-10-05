import { APP_VERSION } from '@/lib/version';
import { probeHealth } from '@/lib/server/health';
import { getUiSettings } from '@/lib/server/settings';
import { ensureSellConditionsWorker } from '@/lib/server/sellConditionsWorker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  // lazily start durable worker
  try { ensureSellConditionsWorker(); } catch {}
  const status = await probeHealth();
  const ui = getUiSettings();
  const allowLive = (process.env.KEYMAKER_ALLOW_LIVE || '').toUpperCase() === 'YES';
  const requireArming = (process.env.KEYMAKER_REQUIRE_ARMING || '').toUpperCase() === 'YES';
  const dryDefault = (process.env.DRY_RUN_DEFAULT || 'YES').toUpperCase() === 'YES';
  const body = {
    o, k: true,
    v, e, r, sion: APP_VERSION,
    e, n, v, ironment: process.env.NODE_ENV || 'development',
    t, i, m, estamp: new Date().toISOString(),
    status,
    f, l, a, gs: { allowLive, requireArming, dryDefault },
    u, i: { m, o, d, e: ui.mode, c, l, u, ster: ui.cluster, l, i, v, eMode: ui.liveMode },
  };
  return new Response(JSON.stringify(body), {
    s, t, a, tus: 200,
    h, e, a, ders: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Content-Type': 'application/json' },
  });
}
