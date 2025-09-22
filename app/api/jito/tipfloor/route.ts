import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getTipFloor } from '@/lib/server/jitoService';
import { rateLimit, getRateConfig } from '@/app/api/rate-limit';

const cache = new Map<string, { at: number; data: any }>();

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const regionParam = url.searchParams.get('region') || 'ffm';
    const region = z.enum(['ffm', 'ams', 'ny', 'tokyo']).parse(regionParam);
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0] || 'anon';
    const cfg = getRateConfig('tipfloor');
    const rl = rateLimit(`tipfloor:${ip}`, cfg.limit, cfg.windowMs) as { ok: boolean };
    if (!rl.ok)
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { 'content-type': 'application/json' },
      });

    const now = Date.now();
    const c = cache.get(region);
    if (c && now - c.at < 1000) return NextResponse.json(c.data);

    const tipFloor = await getTipFloor(region as any);
    const payload = {
      p25: tipFloor.landed_tips_25th_percentile,
      p50: tipFloor.landed_tips_50th_percentile,
      p75: tipFloor.landed_tips_75th_percentile,
      ema_50th: tipFloor.ema_landed_tips_50th_percentile,
      region,
    };
    cache.set(region, { at: now, data: payload });
    return new Response(JSON.stringify(payload), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Tip floor request failed:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Failed to get tip floor' }),
      { status: 500, headers: { 'content-type': 'application/json' } },
    );
  }
}
