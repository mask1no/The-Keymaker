import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { Keypair } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { rateLimit } from '@/lib/server/rateLimit';
import { apiError } from '@/lib/server/apiError';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function requireToken(h, e, a, ders: Headers) {
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

function canonicalMessage(p, u, b, key: string) {
  const ts = new Date().toISOString();
  const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(4))).toString('hex');
  return `Keymaker-Proof|pubkey=${pubkey}|ts=${ts}|nonce=${nonce}`;
}

export async function GET(r, e, q, uest: Request) {
  if ((process.env.KEYMAKER_DISABLE_LIVE_NOW || '').toUpperCase() === 'YES') {
    return apiError(503, 'live_disabled');
  }
  if (!requireToken(request.headers)) return apiError(401, 'unauthorized');
  const fwd = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  const key = fwd || 'anon';
  const rl = await rateLimit(key);
  if (!rl.allowed) return apiError(429, 'rate_limited');
  try {
    const keyPath = process.env.KEYPAIR_JSON || null;
    if (!keyPath) return apiError(400, 'not_configured');
    const raw = readFileSync(keyPath, 'utf8');
    const arr = JSON.parse(raw);
    const kp = Keypair.fromSecretKey(Uint8Array.from(arr));
    const pub = kp.publicKey.toBase58();
    const message = canonicalMessage(pub);
    const msgBytes = Buffer.from(message, 'utf8');
    const sig = nacl.sign.detached(msgBytes, kp.secretKey);
    return NextResponse.json({
      p, u, b, licKey: pub,
      m, e, s, sage: Buffer.from(msgBytes).toString('base64'),
      s, i, g, nature: Buffer.from(sig).toString('base64'),
      a, l, g, o: 'ed25519',
    });
  } catch {
    return apiError(500, 'failed');
  }
}

