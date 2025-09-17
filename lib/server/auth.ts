import nacl from 'tweetnacl'
import { PublicKey } from '@solana/web3.js'
import crypto from 'crypto'

export function verifySignedIntent({
  address,
  nonce,
  signatureBase64,
  body,
}: {
  address: string
  nonce: string
  signatureBase64: string
  body: unknown
}): boolean {
  try {
    const message = new TextEncoder().encode(`${nonce}:${JSON.stringify(body)}`)
    const signature = Buffer.from(signatureBase64, 'base64')
    const publicKey = new PublicKey(address).toBytes()
    return nacl.sign.detached.verify(message, signature, publicKey)
  } catch {
    return false
  }
}

// In-memory nonce cache with TTL
const nonceCache = new Map<string, number>()
const NONCE_TTL = 5 * 60 * 1000 // 5 minutes

export function generateNonce(): string {
  const nonce = Math.random().toString(36).substring(2, 15)
  nonceCache.set(nonce, Date.now() + NONCE_TTL)
  return nonce
}

export function validateNonce(nonce: string): boolean {
  const expiry = nonceCache.get(nonce)
  if (!expiry || Date.now() > expiry) {
    nonceCache.delete(nonce)
    return false
  }
  // One-time use
  nonceCache.delete(nonce)
  return true
}

// Cleanup expired nonces periodically
setInterval(() => {
  const now = Date.now()
  for (const [n, expiry] of nonceCache.entries()) {
    if (now > expiry) nonceCache.delete(n)
  }
}, 60 * 1000)

// Lightweight HMAC-signed session token
const SESSION_COOKIE = 'km_session'
const SESSION_TTL_SECONDS = 10 * 60

function getSigningKey(): string {
  return process.env.SECRET_PASSPHRASE || 'change-this-secret'
}

export function createSessionToken(address: string): string {
  const issuedAt = Date.now()
  const payload = `${address}:${issuedAt}`
  const sig = crypto.createHmac('sha256', getSigningKey()).update(payload).digest('base64url')
  return Buffer.from(`${payload}:${sig}`).toString('base64url')
}

export function verifySessionToken(token: string): { address: string; issuedAt: number } | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8')
    const [address, issuedAtStr, sig] = decoded.split(':')
    if (!address || !issuedAtStr || !sig) return null
    const payload = `${address}:${issuedAtStr}`
    const expected = crypto.createHmac('sha256', getSigningKey()).update(payload).digest('base64url')
    if (sig !== expected) return null
    const issuedAt = Number(issuedAtStr)
    if (!Number.isFinite(issuedAt)) return null
    if (Date.now() - issuedAt > SESSION_TTL_SECONDS * 1000) return null
    return { address, issuedAt }
  } catch {
    return null
  }
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE
}
