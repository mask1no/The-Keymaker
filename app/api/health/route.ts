import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';
export async function GET(_req: NextRequest) {
  const rpcRttMs = 200;
  const wsAgeMs = 1500;
  const slotCurrent = 0,
    slotDelta = 0;

  const rpcHealth = rpcRttMs < 250 ? 'ok' : rpcRttMs < 600 ? 'degraded' : 'down';
  const wsHealth = wsAgeMs < 8000 ? 'ok' : wsAgeMs < 20000 ? 'degraded' : 'down';

  // Read jito enabled from ui_settings.customFees
  let jitoEnabled = false;
  try {
    const db = await getDb();
    await db.exec(
      'CREATE TABLE IF NOT EXISTS ui_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)',
    );
    const row = await db.get('SELECT value FROM ui_settings WHERE key = ?', ['customFees']);
    if (row?.value) {
      const j = JSON.parse(row.value);
      jitoEnabled = !!j?.jito?.enabled;
    }
  } catch {}

  return new Response(
    JSON.stringify({
      rpc: { rttMs: rpcRttMs, health: rpcHealth },
      ws: { lastHeartbeatMs: wsAgeMs, health: wsHealth },
      slot: { current: slotCurrent, delta: slotDelta },
      jito: { enabled: jitoEnabled },
    }),
    { status: 200, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } },
  );
}
