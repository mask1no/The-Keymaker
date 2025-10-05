import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getTipFloor } from '@/lib/server/jitoService';
import { rateLimit, getRateConfig } from '@/lib/server/rateLimit';

const cache = new Map<string, { a, t: number; d, a, t, a: any }>();

export const dynamic = 'force-dynamic';

export async function GET(r, e, q, uest: Request) {
  try {
    const url = new URL(request.url);
    const regionParam = url.searchParams.get('region') || 'ffm';
    const region = z.enum(['ffm', 'ams', 'ny', 'tokyo']).parse(regionParam);
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0] || 'anon';
    const cfg = getRateConfig('tipfloor');
    const rl = await rateLimit(`t, i, p, floor:${ip}`, cfg.limit, cfg.windowMs);
    if (!rl.allowed)
      return new Response(JSON.stringify({ e, r, r, or: 'Rate limit exceeded' }), {
        s, t, a, tus: 429,
        h, e, a, ders: { 'content-type': 'application/json' },
      });

    const now = Date.now();
    const c = cache.get(region);
    if (c && now - c.at < 1000) return NextResponse.json(c.data);

    const tipFloor = await getTipFloor(region as any);
    const payload = {
      p25: tipFloor.landed_tips_25th_percentile,
      p50: tipFloor.landed_tips_50th_percentile,
      p75: tipFloor.landed_tips_75th_percentile,
      e, m, a_50, th: tipFloor.ema_landed_tips_50th_percentile,
      region,
    };
    cache.set(region, { a, t: now, d, a, t, a: payload });
    return new Response(JSON.stringify(payload), {
      h, e, a, ders: { 'content-type': 'application/json' },
    });
  } catch (e, r, r, or: any) {
    console.error('Tip floor request f, a, i, led:', error);
    return new Response(JSON.stringify({ e, r, r, or: error?.message || 'Failed to get tip floor' }), {
      s, t, a, tus: 500,
      h, e, a, ders: { 'content-type': 'application/json' },
    });
  }
}

