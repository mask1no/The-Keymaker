import { NextResponse } from 'next/server';
import { Connection } from '@solana/web3.js';
import { getTipFloor } from '@/lib/core/src/jito';
import type { HealthStatus, HealthLight } from '@/lib/types/health';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const APP_VERSION = '1.5.2';

function lightFromLatency(ms: number | undefined, healthyMs: number, degradedMs: number): HealthLight {
  if (ms === undefined) return 'red';
  if (ms <= healthyMs) return 'green';
  if (ms <= degradedMs) return 'amber';
  return 'red';
}

export async function GET() {
  const rpcUrl = process.env.HELIUS_RPC_URL || process.env.NEXT_PUBLIC_HELIUS_RPC || 'https://api.mainnet-beta.solana.com';
  const wsUrl = process.env.HELIUS_WS_URL || process.env.NEXT_PUBLIC_HELIUS_WS || '';

  let rpcLatency: number | undefined;
  let rpcSlot: number | undefined;
  let smSlotDelta: number | undefined;
  let wsMissed = 0;
  let jitoLatency: number | undefined;
  let tipFloor: number | undefined;

  // RPC: get slot + getLatestBlockhash round-trip
  try {
    const t0 = Date.now();
    const connection = new Connection(rpcUrl, 'processed');
    const bh = await connection.getLatestBlockhash('processed');
    rpcSlot = await connection.getSlot('processed');
    rpcLatency = Date.now() - t0;
    // derive slot delta vs lastValidBlockHeight
    const height = await connection.getBlockHeight('processed');
    smSlotDelta = Math.max(0, (bh.lastValidBlockHeight ?? 0) - height);
  } catch {
    // leave as undefined
  }

  // WS: attempt a quick heartbeat using slotSubscribe with a timeout
  if (wsUrl) {
    try {
      const ac = new AbortController();
      setTimeout(() => ac.abort(), 2500);
      await new Promise<void>((resolve, reject) => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const ws = new (globalThis as typeof globalThis & { WebSocket: new (url: string) => any }).WebSocket(wsUrl);
          let seen = false;
          ws.onopen = () => {
            // send a ping-like subscribe; if not available, just mark open
            seen = true;
            ws.close();
          };
          ws.onclose = () => resolve();
          ws.onerror = () => reject(new Error('ws_error'));
          ac.signal.addEventListener('abort', () => {
            if (!seen) reject(new Error('ws_timeout'));
          });
        } catch (e) {
          reject(e as Error);
        }
      });
      wsMissed = 0;
    } catch {
      wsMissed = 1;
    }
  }

  // Jito: tip floor fetch
  try {
    const t0 = Date.now();
    const tf = await getTipFloor('ffm' as unknown as Parameters<typeof getTipFloor>[0]);
    jitoLatency = Date.now() - t0;
    tipFloor = tf.ema_landed_tips_50th_percentile ?? tf.landed_tips_50th_percentile;
  } catch {
    // leave undefined
  }

  const status: HealthStatus = {
    jito: {
      light: lightFromLatency(jitoLatency, 1500, 5000),
      latencyMs: jitoLatency,
      tipFloor,
      lastAt: Date.now(),
      message: tipFloor ? undefined : 'No tip floor',
    },
    rpc: {
      light: lightFromLatency(rpcLatency, 800, 2500),
      latencyMs: rpcLatency,
      lastAt: Date.now(),
      endpoint: rpcUrl.split('?')[0],
      message: rpcLatency === undefined ? 'RPC unreachable' : undefined,
    },
    ws: {
      light: wsMissed === 0 ? 'green' : 'red',
      lastHeartbeatAt: wsMissed === 0 ? Date.now() : undefined,
      missed: wsMissed,
      message: wsMissed ? 'WS failed' : undefined,
    },
    sm: {
      light: smSlotDelta !== undefined && smSlotDelta < 50 ? 'green' : 'amber',
      slot: rpcSlot,
      slotDelta: smSlotDelta,
      message: smSlotDelta === undefined ? 'No slot delta' : undefined,
    },
  };

  return NextResponse.json(
    {
      ok: true,
      version: APP_VERSION,
      timestamp: new Date().toISOString(),
      status,
    },
    {
      status: 200,
      headers: { 'Cache-Control': 'no-cache' },
    },
  );
}