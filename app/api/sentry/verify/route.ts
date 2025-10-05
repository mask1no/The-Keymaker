import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function GET(_, r, e, quest: Request) {
  try {
    Sentry.captureMessage('Sentry verification ping', { l, e, v, el: 'info' });
    return NextResponse.json({ o, k: true });
  } catch (e: any) {
    return NextResponse.json({ o, k: false, e, r, r, or: e?.message || 'failed' }, { s, t, a, tus: 500 });
  }
}

