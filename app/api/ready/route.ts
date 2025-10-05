import { NextResponse } from 'next/server';
import { probeHealth } from '@/lib/server/health';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const status = await probeHealth();
    const rpcRed = status.rpc.light !== 'green';
    const wsRed = status.ws.light !== 'green';
    const healthy = !rpcRed && !wsRed;
    const code = healthy ? 200 : 503;
    return NextResponse.json(
      { ok: healthy, status },
      {
        status: code,
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      },
    );
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: 'ready_probe_failed' },
      { status: 503 },
    );
  }
}



