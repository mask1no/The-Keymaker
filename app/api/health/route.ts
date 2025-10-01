import { NextResponse } from 'next/server';
import { APP_VERSION } from '@/lib/version';
import { probeHealth } from '@/lib/server/health';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const status = await probeHealth();
  return NextResponse.json(
    { ok: true, version: APP_VERSION, timestamp: new Date().toISOString(), status },
    { status: 200, headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } },
  );
}