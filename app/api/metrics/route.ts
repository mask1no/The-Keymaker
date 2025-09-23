import { NextResponse } from 'next/server';
import { renderMetrics } from '@/lib/server/metricsStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const text = renderMetrics();
  return new NextResponse(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
