import nacl from 'tweetnacl';
import { PublicKey } from '@solana/web3.js';

export function verifySignedIntent({
  address,
  nonce,
  signatureBase64,
  body,
}: {
  address: string;
  nonce: string;
  signatureBase64: string;
  body: unknown;
}): boolean {
  try {
    const message = new TextEncoder().encode(`${nonce}:${JSON.stringify(body)}`);
    const signature = Buffer.from(signatureBase64, 'base64');
    const publicKey = new PublicKey(address).toBytes();
    return nacl.sign.detached.verify(message, signature, publicKey);
  } catch {
    return false;
  }
}

// In-memory nonce cache with TTL
const nonceCache = new Map<string, number>();
const NONCE_TTL = 5 * 60 * 1000; // 5 minutes

export function generateNonce(): string {
  const nonce = Math.random().toString(36).slice(2, 15);
  nonceCache.set(nonce, Date.now() + NONCE_TTL);
  return nonce;
}

export function validateNonce(nonce: string): boolean {
  const expiry = nonceCache.get(nonce);
  if (!expiry || Date.now() > expiry) {
    nonceCache.delete(nonce);
    return false;
  }
  // one-time use
  nonceCache.delete(nonce);
  return true;
}

// Cleanup expired nonces periodically
setInterval(() => {
  const now = Date.now();
  for (const [nonce, expiry] of nonceCache.entries()) {
    if (now > expiry) {
      nonceCache.delete(nonce);
    }
  }
}, 60 * 1000);
