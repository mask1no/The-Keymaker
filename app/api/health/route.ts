import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export async function GET(_req: NextRequest) {
  // Implement your own RPC/WS checks. Placeholder values; wire to your monitors.
  const rpcRttMs = 120; // measure periodically or on-demand
  const wsAgeMs = 1200;
  const slotCurrent = 0,
    slotDelta = 0;

  const rpcHealth = rpcRttMs < 250 ? 'ok' : rpcRttMs < 600 ? 'degraded' : 'down';
  const wsHealth = wsAgeMs < 8000 ? 'ok' : wsAgeMs < 20000 ? 'degraded' : 'down';

  // Read jito enabled from settings storage if available; default false
  const jitoEnabled = false;

  return new Response(
    JSON.stringify({
      rpc: { rttMs: rpcRttMs, health: rpcHealth },
      ws: { lastHeartbeatMs: wsAgeMs, health: wsHealth },
      slot: { current: slotCurrent, delta: slotDelta },
      jito: { enabled: jitoEnabled },
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
}
