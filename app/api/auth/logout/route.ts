import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    clearSessionCookie();
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error)?.message || 'failed' }, { status: 500 });
  }
}


