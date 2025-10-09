import 'server-only';
import { cookies } from 'next/headers';
import { createHmac } from 'crypto';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'km_session';
const SESSION_TTL_SEC = 24 * 60 * 60; // 24 hours

export type SessionPayload = {
  sub: string; // user pubkey
  uaHash?: string; // optional user-agent hash
  origin?: string; // optional origin
  exp: number; // epoch seconds
};

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

export function createSessionCookie(sub: string, uaHash?: string, origin?: string): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SEC;
  const payload: SessionPayload = { sub, exp };
  if (uaHash) payload.uaHash = uaHash;
  if (origin) payload.origin = origin;

  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = hmac(b64);
  return `v1.${b64}.${sig}`;
}

function verifySessionValue(value: string | null | undefined): SessionPayload | null {
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

export function getSession(req: NextRequest): { sub: string } | null {
  const value = req.cookies.get(SESSION_COOKIE)?.value;
  const payload = verifySessionValue(value);
  if (!payload) return null;
  return { sub: payload.sub };
}

export function setSessionCookie(sub: string, uaHash?: string, origin?: string): void {
  const value = createSessionCookie(sub, uaHash, origin);
  cookies().set(SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SEC,
  });
}

export function clearSessionCookie(): void {
  cookies().set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export function getSessionFromCookies(): { sub: string } | null {
  const value = cookies().get(SESSION_COOKIE)?.value;
  const payload = verifySessionValue(value);
  if (!payload) return null;
  return { sub: payload.sub };
}

const nonceStore = new Map<string, number>();
const NONCE_TTL_MS = 5 * 60 * 1000;

export function generateNonce(): string {
  const randomBytes = require('crypto').randomBytes;
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
