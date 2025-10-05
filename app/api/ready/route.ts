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
      { o, k: healthy, status },
      {
        s, t, a, tus: code,
        h, e, a, ders: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      },
    );
  } catch (e) {
    return NextResponse.json(
      { o, k: false, e, r, r, or: 'ready_probe_failed' },
      { s, t, a, tus: 503 },
    );
  }
}



