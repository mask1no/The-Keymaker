import { NextResponse } from 'next/server';
import { getBundleStatuses } from '@/lib/server/jitoService';
import { rateLimit } from '@/app/api/rate-limit'

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0] || 'anon'
    const rl = rateLimit(`status:${ip}`, 60, 60_000)
    if (!rl.ok) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const body = await request.json();
    const region = (body?.region || 'ffm') as any;
    const ids: unknown = body?.bundle_ids
    if (!Array.isArray(ids)) {
      return NextResponse.json({ error: 'bundle_ids must be an array' }, { status: 400 })
    }
    const idsTyped: string[] = (ids as unknown[]).map(String)
    if (!idsTyped.length) {
      return NextResponse.json({ error: 'bundle_ids required' }, { status: 400 });
    }
    const statuses = await getBundleStatuses(region, idsTyped);
    return NextResponse.json({ region, statuses });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
