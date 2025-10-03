import { NextResponse } from 'next/server';
import { probeHealth } from '@/lib/server/health';
export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';
export async function GET() {
  const status = await probeHealth();
  return NextResponse.json({ ok: true, status }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
}
