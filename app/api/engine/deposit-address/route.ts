import { NextResponse } from 'next/server';
import { Keypair } from '@solana/web3.js';
import { readFileSync } from 'fs';
import { rateLimit } from '@/lib/server/rateLimit';
import { apiError } from '@/lib/server/apiError';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function requireToken(headers: Headers) {
  const expected = process.env.ENGINE_API_TOKEN;
  if (process.env.NODE_ENV === 'production') {
    if (!expected) return false;
    const got = headers.get('x-engine-token');
    return got === expected;
  }
  if (!expected) return true;
  const got = headers.get('x-engine-token');
  return got === expected;
}

export async function GET(request: Request) {
  try {
    if ((process.env.KEYMAKER_DISABLE_LIVE_NOW || '').toUpperCase() === 'YES') {
      return apiError(503, 'live_disabled');
    }
    if (!requireToken(request.headers)) return apiError(401, 'unauthorized');
    const fwd = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
    const key = fwd || 'anon';
    if (!rateLimit(key)) return apiError(429, 'rate_limited');

    const keyPath = process.env.KEYPAIR_JSON || null;
    if (!keyPath) return NextResponse.json({ error: 'not_configured' }, { status: 400 });
    const raw = readFileSync(keyPath, 'utf8');
    const arr = JSON.parse(raw);
    const kp = Keypair.fromSecretKey(Uint8Array.from(arr));
    return NextResponse.json({ publicKey: kp.publicKey.toBase58() });
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
