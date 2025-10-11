import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function GET(_request: Request) {
  try {
    Sentry.captureMessage('Sentry verification ping', { level: 'info' });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'failed';
    return NextResponse.json({ ok: false, error: errorMessage }, { status: 500 });
  }
}
