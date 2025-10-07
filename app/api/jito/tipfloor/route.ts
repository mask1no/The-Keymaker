import { NextResponse } from 'next/server';
import { z } from 'zod';
// import { getTipFloor } from '@/lib/server/jitoService';
import { rateLimit, getRateConfig } from '@/lib/server/rateLimit';

const cache = new Map<string, { at: number; data: any }>();

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const regionParam = url.searchParams.get('region') || 'ffm';
    const region = z.enum(['ffm', 'ams', 'ny', 'tokyo']).parse(regionParam);
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0] || 'anon';
    const cfg = getRateConfig('tipfloor');
    const rl = await rateLimit(`tipfloor:${ip}`, cfg.limit, cfg.windowMs);
    if (!rl.allowed)
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { 'content-type': 'application/json' },
      });

    return NextResponse.json({ error: 'bundler_disabled' }, { status: 501 });
  } catch (error: any) {
    console.error('Tip floor request failed:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Failed to get tip floor' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
