import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
export const runtime = 'nodejs';
const rpcClass = (ms: number) => (ms < 250 ? 'ok' : ms < 600 ? 'degraded' : 'down');
const wsClass = (ms: number) => (ms < 8000 ? 'ok' : ms < 20000 ? 'degraded' : 'down');

export async function GET(_req: NextRequest) {
  const db = await getDb();
  let jitoEnabled = false;
  try {
    await db.exec(
      'CREATE TABLE IF NOT EXISTS ui_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)',
    );
    const r = await db.get('SELECT value FROM ui_settings WHERE key = ?', ['customFees']);
    jitoEnabled = !!(r?.value && JSON.parse(r.value)?.jito?.enabled);
  } catch {}
  const rpcRttMs = 200,
    wsAgeMs = 1500,
    slotCurrent = 0,
    slotDelta = 0;
  return new Response(
    JSON.stringify({
      rpc: { rttMs: rpcRttMs, health: rpcClass(rpcRttMs) },
      ws: { lastHeartbeatMs: wsAgeMs, health: wsClass(wsAgeMs) },
      slot: { current: slotCurrent, delta: slotDelta },
      jito: { enabled: jitoEnabled },
    }),
    { status: 200, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } },
  );
}
