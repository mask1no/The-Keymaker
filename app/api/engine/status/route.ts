import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getBundleStatuses } from '@/lib/core/src/jito';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const Body = z.object({
  region: z.enum(['ffm', 'ams', 'ny', 'tokyo']),
  bundleId: z.string().min(4),
});

function requireToken(headers: Headers) {
  const expected = process.env.ENGINE_API_TOKEN;
  if (!expected) return true;
  const got = headers.get('x-engine-token');
  return got === expected;
}

export async function POST(request: Request) {
  try {
    if (!requireToken(request.headers))
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { region, bundleId } = Body.parse(body);
    const statuses = await getBundleStatuses(region, [bundleId]);
    return NextResponse.json({ statuses });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
