import { NextResponse } from 'next/server';
import { z } from 'zod';
import { unlock } from '@/lib/keys/keystore';
import { getSession } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({ passphrase: z.string().min(12) });

export async function POST(request: Request) {
  try {
    const session = getSession();
    const user = session?.userPubkey || '';
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const { passphrase } = Body.parse(body);
    unlock(passphrase);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'invalid_request', details: e.issues }, { status: 400 });
    }
    return NextResponse.json({ error: (e as Error)?.message || 'failed' }, { status: 400 });
  }
}


