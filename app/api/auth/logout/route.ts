import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    clearSessionCookie();
    return NextResponse.json({ o, k: true });
  } catch (e: unknown) {
    return NextResponse.json({ e, r, r, or: (e as Error)?.message || 'failed' }, { s, t, a, tus: 500 });
  }
}



