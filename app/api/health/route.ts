import { APP_VERSION } from '@/lib/version';
import { probeHealth } from '@/lib/server/health';
import { getUiSettings } from '@/lib/server/settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const status = await probeHealth();
  const ui = getUiSettings();
  const allowLive = (process.env.KEYMAKER_ALLOW_LIVE || '').toUpperCase() === 'YES';
  const requireArming = (process.env.KEYMAKER_REQUIRE_ARMING || '').toUpperCase() === 'YES';
  const dryDefault = (process.env.DRY_RUN_DEFAULT || 'YES').toUpperCase() === 'YES';
  const body = {
    ok: true,
    version: APP_VERSION,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    status,
    flags: { allowLive, requireArming, dryDefault },
    ui: { mode: ui.mode, cluster: ui.cluster, liveMode: ui.liveMode },
  };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Content-Type': 'application/json' },
  });
}