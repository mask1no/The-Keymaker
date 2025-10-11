import { NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const s = getSessionFromCookies();
    if (!s) return NextResponse.json({ error: 'no_session' }, { status: 401 });
    return NextResponse.json({ pubkey: s.sub });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error)?.message || 'failed' }, { status: 500 });
  }
}
