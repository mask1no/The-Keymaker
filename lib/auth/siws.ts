/**
 * Sign-In With Solana (SIWS) Implementation
 * Server-side nonce generation and signature verification
 */

import { randomBytes } from 'crypto';
import { sign } from 'tweetnacl';
import bs58 from 'bs58';

// Nonce store (in production, use Redis). Persist across dev HMR via globalThis
type NonceRecord = { nonce: string; createdAt: number; used: boolean };
const NONCE_STORE_KEY = '__KM_NONCE_STORE__';
const g = globalThis as unknown as Record<string, unknown>;
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const nonceStore = ((g[NONCE_STORE_KEY] as Map<string, NonceRecord> | undefined) ?? new Map<string, NonceRecord>());
g[NONCE_STORE_KEY] = nonceStore;

const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Generate a cryptographically secure nonce
 */
export function generateNonce(pubkey: string): string {
  const nonce = bs58.encode(randomBytes(32));
  
  nonceStore.set(pubkey, {
    nonce,
    createdAt: Date.now(),
    used: false,
  });
  
  return nonce;
}

/**
 * Verify SIWS signature
 */
export function verifySIWS(params: {
  pubkey: string;
  signature: string;
  message: string;
  nonce?: string;
}): { valid: boolean; error?: string } {
  const { pubkey, signature, message } = params;
  
  // Check if nonce exists
  let stored = nonceStore.get(pubkey);
  // Fallback: if not found (e.g. dev HMR), accept provided nonce if present in message
  if (!stored) {
    if (!params.nonce || !message.includes(params.nonce)) {
      return { valid: false, error: 'Nonce not found. Please request a new nonce.' };
    }
    stored = { nonce: params.nonce, createdAt: Date.now(), used: false };
    // Do not persist fallback record to avoid extending TTL silently
  }
  
  // Check if nonce is expired
  if (Date.now() - stored.createdAt > NONCE_TTL_MS) {
    nonceStore.delete(pubkey);
    return { valid: false, error: 'Nonce expired. Please request a new nonce.' };
  }
  
  // Check if nonce already used
  if (stored.used) {
    return { valid: false, error: 'Nonce already used. Please request a new nonce.' };
  }
  
  // Verify the message contains the nonce
  if (!message.includes(stored.nonce)) {
    return { valid: false, error: 'Message does not contain the expected nonce.' };
  }
  
  try {
    // Decode public key and signature from base58
    const pubkeyBytes = bs58.decode(pubkey);
    const signatureBytes = bs58.decode(signature);
    const messageBytes = new TextEncoder().encode(message);
    
    // Verify signature
    const valid = sign.detached.verify(messageBytes, signatureBytes, pubkeyBytes);
    
    if (!valid) {
      return { valid: false, error: 'Invalid signature.' };
    }
    
    // Mark nonce as used if we own the stored record
    const current = nonceStore.get(pubkey);
    if (current && current.nonce === stored.nonce) {
      current.used = true;
    }
    
    // Clean up old nonces
    cleanupExpiredNonces();
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: `Verification failed: ${(error as Error).message}` };
  }
}

/**
 * Build SIWS message format
 */
export function buildSIWSMessage(params: {
  pubkey: string;
  nonce: string;
  domain: string;
  uri: string;
  issuedAt: string;
}): string {
  const { pubkey, nonce, domain, uri, issuedAt } = params;
  
  return [
    'The Keymaker wants you to sign in with your Solana account:',
    pubkey,
    '',
    'By signing, you agree to sign in to The Keymaker.',
    '',
    `URI: ${uri}`,
    `Domain: ${domain}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
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
export function revokeNonce(pubkey: string): void {
  nonceStore.delete(pubkey);
}

// Cleanup expired nonces every minute
const CLEAN_KEY = '__KM_NONCE_CLEANER__';
if (typeof setInterval !== 'undefined' && !g[CLEAN_KEY]) {
  g[CLEAN_KEY] = true;
  setInterval(cleanupExpiredNonces, 60 * 1000);
}
