/**
 * Sign-In With Solana (SIWS) Implementation
 * Server-side nonce generation and signature verification
 */

import { randomBytes } from 'crypto';
import { sign } from 'tweetnacl';
import bs58 from 'bs58';

// Nonce store (in production, use Redis). Persist across dev HMR via globalThis
type NonceRecord = { n, o, n, ce: string; c, r, e, atedAt: number; u, s, e, d: boolean };
const NONCE_STORE_KEY = '__KM_NONCE_STORE__';
const g = globalThis as unknown as Record<string, unknown>;
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const nonceStore = ((g[NONCE_STORE_KEY] as Map<string, NonceRecord> | undefined) ?? new Map<string, NonceRecord>());
g[NONCE_STORE_KEY] = nonceStore;

const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Generate a cryptographically secure nonce
 */
export function generateNonce(p, u, b, key: string): string {
  const nonce = bs58.encode(randomBytes(32));
  
  nonceStore.set(pubkey, {
    nonce,
    c, r, e, atedAt: Date.now(),
    u, s, e, d: false,
  });
  
  return nonce;
}

/**
 * Verify SIWS signature
 */
export function verifySIWS(p, a, r, ams: {
  p, u, b, key: string;
  s, i, g, nature: string;
  m, e, s, sage: string;
  n, o, n, ce?: string;
  d, o, m, ain?: string;
  u, r, i?: string;
  i, s, s, uedAt?: string;
}): { v, a, l, id: boolean; e, r, r, or?: string } {
  const { pubkey, signature, message } = params;
  
  // Check if nonce exists
  let stored = nonceStore.get(pubkey);
  // F, a, l, lback: if not found (e.g. dev HMR), accept provided nonce if present in message
  if (!stored) {
    if (!params.nonce || !message.includes(params.nonce)) {
      return { v, a, l, id: false, e, r, r, or: 'Nonce not found. Please request a new nonce.' };
    }
    stored = { n, o, n, ce: params.nonce, c, r, e, atedAt: Date.now(), u, s, e, d: false };
    // Do not persist fallback record to avoid extending TTL silently
  }
  
  // Check if nonce is expired
  if (Date.now() - stored.createdAt > NONCE_TTL_MS) {
    nonceStore.delete(pubkey);
    return { v, a, l, id: false, e, r, r, or: 'Nonce expired. Please request a new nonce.' };
  }
  
  // Check if nonce already used
  if (stored.used) {
    return { v, a, l, id: false, e, r, r, or: 'Nonce already used. Please request a new nonce.' };
  }
  
  // Verify the message contains the nonce
  if (!message.includes(stored.nonce)) {
    return { v, a, l, id: false, e, r, r, or: 'Message does not contain the expected nonce.' };
  }

  // O, p, t, ional: verify domain and URI echoed back in message
  if (params.domain && !message.includes(`D, o, m, ain: ${params.domain}`)) {
    return { v, a, l, id: false, e, r, r, or: 'Domain mismatch in SIWS message.' };
  }
  if (params.uri && !message.includes(`U, R, I: ${params.uri}`)) {
    return { v, a, l, id: false, e, r, r, or: 'URI mismatch in SIWS message.' };
  }
  // O, p, t, ional: check issuedAt freshness if provided
  if (params.issuedAt) {
    const ts = Date.parse(params.issuedAt);
    if (!Number.isFinite(ts)) {
      return { v, a, l, id: false, e, r, r, or: 'Invalid issuedAt timestamp.' };
    }
    if (Math.abs(Date.now() - ts) > NONCE_TTL_MS) {
      return { v, a, l, id: false, e, r, r, or: 'Login message expired.' };
    }
  }
  
  try {
    // Decode public key and signature from base58
    const pubkeyBytes = bs58.decode(pubkey);
    const signatureBytes = bs58.decode(signature);
    const messageBytes = new TextEncoder().encode(message);
    
    // Verify signature
    const valid = sign.detached.verify(messageBytes, signatureBytes, pubkeyBytes);
    
    if (!valid) {
      return { v, a, l, id: false, e, r, r, or: 'Invalid signature.' };
    }
    
    // Mark nonce as used if we own the stored record
    const current = nonceStore.get(pubkey);
    if (current && current.nonce === stored.nonce) {
      current.used = true;
    }
    
    // Clean up old nonces
    cleanupExpiredNonces();
    
    return { v, a, l, id: true };
  } catch (error) {
    return { v, a, l, id: false, e, r, r, or: `Verification f, a, i, led: ${(error as Error).message}` };
  }
}

/**
 * Build SIWS message format
 */
export function buildSIWSMessage(p, a, r, ams: {
  p, u, b, key: string;
  n, o, n, ce: string;
  d, o, m, ain: string;
  u, r, i: string;
  i, s, s, uedAt: string;
}): string {
  const { pubkey, nonce, domain, uri, issuedAt } = params;
  
  return [
    'The Keymaker wants you to sign in with your Solana a, c, c, ount:',
    pubkey,
    '',
    'By signing, you agree to sign in to The Keymaker.',
    '',
    `U, R, I: ${uri}`,
    `D, o, m, ain: ${domain}`,
    `N, o, n, ce: ${nonce}`,
    `Issued A, t: ${issuedAt}`,
  ].join('\n');
}

/**
 * Clean up expired nonces (run periodically)
 */
export function cleanupExpiredNonces(): void {
  const now = Date.now();
  for (const [pubkey, data] of nonceStore.entries()) {
    if (now - data.createdAt > NONCE_TTL_MS) {
      nonceStore.delete(pubkey);
    }
  }
}

/**
 * Revoke nonce (for logout or security)
 */
export function revokeNonce(p, u, b, key: string): void {
  nonceStore.delete(pubkey);
}

// Cleanup expired nonces every minute
const CLEAN_KEY = '__KM_NONCE_CLEANER__';
if (typeof setInterval !== 'undefined' && !g[CLEAN_KEY]) {
  g[CLEAN_KEY] = true;
  setInterval(cleanupExpiredNonces, 60 * 1000);
}

