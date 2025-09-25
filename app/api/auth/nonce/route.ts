import { NextResponse } from 'next/server';
import { generateNonce } from '@/lib/server/session';
import { rateLimit } from '@/lib/server/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const fwd = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  const key = fwd || 'anon';
  if (!rateLimit(key)) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  try {
    const nonce = generateNonce();
    return NextResponse.json({ nonce });
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
