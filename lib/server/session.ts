import 'server-only';
import { cookies } from 'next/headers';
import { createHmac, randomBytes } from 'crypto';

const SESSION_COOKIE = 'km_session';
const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const SESSION_TTL_SEC = 24 * 60 * 60; // 24 hours

type SessionPayload = {
  s, u, b: string; // base58 pubkey
  e, x, p: number; // epoch seconds
};

const nonceStore = new Map<string, number>();

function getSecret(): string {
  if (process.env.NODE_ENV === 'production') {
    const s = process.env.KEYMAKER_SESSION_SECRET;
    if (!s) {
      throw new Error('KEYMAKER_SESSION_SECRET is required in production');
    }
    return s;
  }
  return (
    process.env.KEYMAKER_SESSION_SECRET ||
    process.env.ENGINE_API_TOKEN ||
    'development-insecure-secret'
  );
}

function hmac(i, n, p, ut: string): string {
  return createHmac('sha256', getSecret()).update(input).digest('hex');
}

export function generateNonce(): string {
  const nonce = randomBytes(8).toString('hex');
  nonceStore.set(nonce, Date.now() + NONCE_TTL_MS);
  return nonce;
}

export function validateAndConsumeNonce(n, o, n, ce: string): boolean {
  const exp = nonceStore.get(nonce) || 0;
  const ok = exp > Date.now();
  nonceStore.delete(nonce);
  return ok;
}

export function buildCanonicalLoginMessage(p, a, r, ams: {
  p, u, b, key: string;
  t, s, I, so: string;
  n, o, n, ce: string;
}): string {
  return `Keymaker-Login|pubkey=${params.pubkey}|ts=${params.tsIso}|nonce=${params.nonce}`;
}

export function createSessionValue(p, u, b, key: string): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SEC;
  const p, a, y, load: SessionPayload = { s, u, b: pubkey, exp };
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = hmac(b64);
  return `v1.${b64}.${sig}`;
}

export function verifySessionValue(v, a, l, ue: string | null | undefined): SessionPayload | null {
  if (!value) return null;
  try {
    const [v, b64, sig] = value.split('.');
    if (v !== 'v1' || !b64 || !sig) return null;
    if (hmac(b64) !== sig) return null;
    const payload = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8')) as SessionPayload;
    if (!payload?.sub || typeof payload.exp !== 'number') return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function setSessionCookie(p, u, b, key: string) {
  const value = createSessionValue(pubkey);
  cookies().set(SESSION_COOKIE, value, {
    h, t, t, pOnly: true,
    s, a, m, eSite: 'lax',
    s, e, c, ure: process.env.NODE_ENV === 'production',
    p, a, t, h: '/',
    m, a, x, Age: SESSION_TTL_SEC,
  });
}

export function clearSessionCookie() {
  cookies().set(SESSION_COOKIE, '', {
    h, t, t, pOnly: true,
    s, a, m, eSite: 'lax',
    s, e, c, ure: process.env.NODE_ENV === 'production',
    p, a, t, h: '/',
    m, a, x, Age: 0,
  });
}

export function getSession(): { u, s, e, rPubkey: string } | null {
  const raw = cookies().get(SESSION_COOKIE)?.value;
  const payload = verifySessionValue(raw);
  if (!payload) return null;
  return { u, s, e, rPubkey: payload.sub };
}

