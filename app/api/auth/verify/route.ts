import { NextResponse } from 'next/server';
import nacl from 'tweetnacl';
import { PublicKey } from '@solana/web3.js';
import { rateLimit } from '@/lib/server/rateLimit';
import {
  buildCanonicalLoginMessage,
  setSessionCookie,
  validateAndConsumeNonce,
} from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type VerifyBody = {
  pubkey: string; // base58
  tsIso: string;
  nonce: string;
  messageBase64: string;
  signatureBase64: string;
};

export async function POST(request: Request) {
  const fwd = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  const key = fwd || 'anon';
  if (!rateLimit(key)) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  // 8KB cap
  const cl = Number(request.headers.get('content-length') || '0');
  if (cl > 8192) return NextResponse.json({ error: 'payload_too_large' }, { status: 413 });
  try {
    const rawText = await request.text();
    if (Buffer.byteLength(rawText || '', 'utf8') > 8192)
      return NextResponse.json({ error: 'payload_too_large' }, { status: 413 });
    const body = (rawText ? JSON.parse(rawText) : {}) as Partial<VerifyBody>;
    const { pubkey, tsIso, nonce, messageBase64, signatureBase64 } = body as VerifyBody;
    if (!pubkey || !tsIso || !nonce || !messageBase64 || !signatureBase64)
      return NextResponse.json({ error: 'bad_request' }, { status: 400 });
    if (!validateAndConsumeNonce(nonce))
      return NextResponse.json({ error: 'invalid_nonce' }, { status: 400 });

    const expected = buildCanonicalLoginMessage({ pubkey, tsIso, nonce });
    const expectedBytes = Buffer.from(expected, 'utf8');
    const msg = Buffer.from(messageBase64, 'base64');
    const sig = Buffer.from(signatureBase64, 'base64');
    if (!expectedBytes.equals(msg))
      return NextResponse.json({ error: 'invalid_message' }, { status: 400 });
    const pk = new PublicKey(pubkey).toBytes();
    const ok = nacl.sign.detached.verify(msg, sig, pk);
    if (!ok) return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });

    setSessionCookie(pubkey);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
