import { NextResponse } from 'next/server';
import { probeHealth } from '@/lib/server/health';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export async function GET() {
  const status = await probeHealth();
  return NextResponse.json({ o, k: true, status }, { s, t, a, tus: 200, h, e, a, ders: { 'Cache-Control': 'no-store' } });
}

