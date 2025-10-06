import 'server-only';
import { cookies, headers } from 'next/headers';
import { createHmac, randomBytes } from 'crypto';

const SESSION_COOKIE = 'km_session';
const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const SESSION_TTL_SEC = 24 * 60 * 60; // 24 hours

type SessionPayload = {
  sub: string; // base58 pubkey
  exp: number; // epoch seconds
  ua: string; // sha256 hash of user-agent string
  origin: string; // request origin host
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

function hmac(input: string): string {
  return createHmac('sha256', getSecret()).update(input).digest('hex');
}

export function generateNonce(): string {
  const nonce = randomBytes(8).toString('hex');
  nonceStore.set(nonce, Date.now() + NONCE_TTL_MS);
  return nonce;
}

export function validateAndConsumeNonce(nonce: string): boolean {
  const exp = nonceStore.get(nonce) || 0;
  const ok = exp > Date.now();
  nonceStore.delete(nonce);
  return ok;
}

export function buildCanonicalLoginMessage(params: {
  pubkey: string;
  tsIso: string;
  nonce: string;
}): string {
  return `Keymaker-Login|pubkey=${params.pubkey}|ts=${params.tsIso}|nonce=${params.nonce}`;
}

function sha256Hex(value: string): string {
  return createHmac('sha256', 'ua-salt').update(value).digest('hex');
}

function getFingerprint(): { uaHash: string; origin: string; addr?: string } {
  try {
    const h = headers();
    const ua = h.get('user-agent') || '';
    const origin = (() => {
      const o = h.get('origin') || '';
      if (o) {
        try {
          return new URL(o).host;
        } catch {}
      }
      return h.get('host') || '';
    })();
    const addr = (h.get('x-forwarded-for') || '').split(',')[0].trim() || undefined;
    return { uaHash: sha256Hex(ua), origin, addr };
  } catch {
    return { uaHash: sha256Hex(''), origin: '' };
  }
}

export function createSessionValue(pubkey: string): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SEC;
  const fp = getFingerprint();
  const payload: SessionPayload = { sub: pubkey, exp, ua: fp.uaHash, origin: fp.origin };
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = hmac(b64);
  return `v2.${b64}.${sig}`;
}

export function verifySessionValue(value: string | null | undefined): SessionPayload | null {
  if (!value) return null;
  try {
    const [v, b64, sig] = value.split('.');
    if ((v !== 'v1' && v !== 'v2') || !b64 || !sig) return null;
    if (hmac(b64) !== sig) return null;
    const payload = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8')) as SessionPayload;
    if (!payload?.sub || typeof payload.exp !== 'number') return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function setSessionCookie(pubkey: string) {
  const value = createSessionValue(pubkey);
  cookies().set(SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SEC,
  });
}

export function clearSessionCookie() {
  cookies().set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export function getSession(): { userPubkey: string } | null {
  const raw = cookies().get(SESSION_COOKIE)?.value;
  const payload = verifySessionValue(raw);
  if (!payload) return null;
  // Bind session to UA and origin; invalidate on change
  try {
    const fp = getFingerprint();
    if (
      (payload.ua && payload.ua !== fp.uaHash) ||
      (payload.origin && payload.origin !== fp.origin)
    ) {
      return null;
    }
  } catch {}
  return { userPubkey: payload.sub };
}
