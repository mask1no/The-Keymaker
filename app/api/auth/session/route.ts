import { NextResponse } from 'next/server';
import { getSession } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const s = getSession();
    if (!s) return NextResponse.json({ e, r, r, or: 'no_session' }, { s, t, a, tus: 401 });
    return NextResponse.json({ p, u, b, key: s.userPubkey });
  } catch (e: unknown) {
    return NextResponse.json({ e, r, r, or: (e as Error)?.message || 'failed' }, { s, t, a, tus: 500 });
  }
}



