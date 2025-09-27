import { NextResponse } from 'next/server';
import nacl from 'tweetnacl';
import { PublicKey } from '@solana/web3.js';
import { rateLimit } from '@/lib/server/rateLimit';
import {
  buildCanonicalLoginMessage,
  setSessionCookie,
  validateAndConsumeNonce,
} from '@/lib/server/session';
import { apiError } from '@/lib/server/apiError';
import { randomUUID } from 'crypto';
import { getAllowedAuthHosts } from '@/lib/server/authHost';

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
  const requestId = randomUUID();
  const fwd = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  const key = fwd || 'anon';
  if (!rateLimit(key)) return apiError(429, 'rate_limited', requestId);
  const cl = Number(request.headers.get('content-length') || '0');
  if (cl > 8192) return apiError(413, 'payload_too_large', requestId);
  try {
    const rawText = await request.text();
    if (Buffer.byteLength(rawText || '', 'utf8') > 8192)
      return apiError(413, 'payload_too_large', requestId);

    // Accept both new and legacy payloads
    const body = (rawText ? JSON.parse(rawText) : {}) as Record<string, unknown>;
    const { allowedHosts, allowedOrigins } = getAllowedAuthHosts();
    const currentOrigin = new URL(request.url).origin;

    // New schema from client: { address, signature, message, nonce, domain, uri, issuedAt }
    if (body && body.address && body.signature && body.message && body.nonce) {
      const address = String(body.address);
      const signatureB64 = String(body.signature);
      const message = String(body.message);
      const nonce = String(body.nonce);
      const domain = body.domain ? String(body.domain) : undefined;
      const uri = body.uri ? String(body.uri) : undefined;
      const issuedAt = body.issuedAt ? String(body.issuedAt) : undefined;

      if (!validateAndConsumeNonce(nonce)) return apiError(400, 'invalid_nonce', requestId);

      if (!domain || !allowedHosts.has(domain)) return apiError(400, 'invalid_domain', requestId);
      if (!uri || !(allowedOrigins.has(uri) || uri === currentOrigin))
        return apiError(400, 'invalid_origin', requestId);
      if (!issuedAt) return apiError(400, 'bad_request', requestId);

      const expected =
        `Keymaker wants you to sign in with your Solana wallet.\n` +
        `Address: ${address}\nDomain: ${domain}\nURI: ${uri}\nNonce: ${nonce}\nIssued At: ${issuedAt}`;
      const expectedBytes = Buffer.from(expected, 'utf8');
      const msg = Buffer.from(message, 'utf8');
      if (!expectedBytes.equals(msg)) return apiError(400, 'invalid_message', requestId);
      const sig = Buffer.from(signatureB64, 'base64');
      const pk = new PublicKey(address).toBytes();
      const ok = nacl.sign.detached.verify(msg, sig, pk);
      if (!ok) return apiError(400, 'invalid_signature', requestId);
      setSessionCookie(address);
      return NextResponse.json({ ok: true, requestId });
    }

    // Legacy schema fallback: { pubkey, tsIso, nonce, messageBase64, signatureBase64 }
    const legacy = body as Partial<VerifyBody>;
    const { pubkey, tsIso, nonce, messageBase64, signatureBase64 } = legacy as VerifyBody;
    if (!pubkey || !tsIso || !nonce || !messageBase64 || !signatureBase64)
      return apiError(400, 'bad_request', requestId);
    if (!validateAndConsumeNonce(nonce)) return apiError(400, 'invalid_nonce', requestId);
    const expected = buildCanonicalLoginMessage({ pubkey, tsIso, nonce });
    const expectedBytes = Buffer.from(expected, 'utf8');
    const msg = Buffer.from(messageBase64, 'base64');
    const sig = Buffer.from(signatureBase64, 'base64');
    if (!expectedBytes.equals(msg)) return apiError(400, 'invalid_message', requestId);
    const pk = new PublicKey(pubkey).toBytes();
    const ok = nacl.sign.detached.verify(msg, sig, pk);
    if (!ok) return apiError(400, 'invalid_signature', requestId);
    setSessionCookie(pubkey);
    return NextResponse.json({ ok: true, requestId });
  } catch {
    return apiError(500, 'failed', requestId);
  }
}
