import { NextResponse } from 'next/server';
import { Connection } from '@solana/web3.js';
import { NEXT_PUBLIC_HELIUS_RPC } from '@/constants';
import { getTipFloor } from '@/lib/core/src/jito';
import { incCounter } from '@/lib/server/metricsStore';
import { isTestMode } from '@/lib/testMode';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const started = Date.now();
  let rpcLatency = -1;
  let jitoLatency = -1;
  if (isTestMode()) {
    return NextResponse.json({
      ok: true,
      version: process.env.npm_package_version || 'dev',
      timestamp: new Date().toISOString(),
      checks: {
        rpc: { status: 'healthy', latency_ms: 10 },
        jito: { status: 'healthy', latency_ms: 5, region: 'ffm' },
        database: { status: 'healthy' },
      },
      duration_ms: Date.now() - started,
    });
  }
  const connection = new Connection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed');
  try {
    const t0 = Date.now();
    await connection.getSlot();
    rpcLatency = Date.now() - t0;
  } catch (e) {
    rpcLatency = -1;
  }

  try {
    const t1 = Date.now();
    await getTipFloor('ffm');
    jitoLatency = Date.now() - t1;
  } catch (e) {
    jitoLatency = -1;
  }

  // No DB dependency in lean mode

  const res = NextResponse.json({
    ok: rpcLatency >= 0 && jitoLatency >= 0,
    version: process.env.npm_package_version || 'dev',
    timestamp: new Date().toISOString(),
    checks: {
      rpc: { status: rpcLatency >= 0 ? 'healthy' : 'down', latency_ms: rpcLatency },
      jito: {
        status: jitoLatency >= 0 ? 'healthy' : 'down',
        latency_ms: jitoLatency,
        region: 'ffm',
      },
      database: { status: 'n/a' },
    },
    duration_ms: Date.now() - started,
  });
  incCounter('engine_2xx_total');
  return res;
}
