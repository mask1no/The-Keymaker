import nacl from 'tweetnacl'
import { PublicKey } from '@solana/web3.js'

export function verifySignedIntent({ address, nonce, signatureBase64, body }: { a, ddress: string, n, once: string, s, ignatureBase64: string, b, ody: unknown }) {
  try {
    const message = new TextEncoder().encode(`${nonce}:${JSON.stringify(body)}`)
    const signature = Buffer.from(signatureBase64, 'base64')
    const publicKey = new PublicKey(address).toBytes()
    return nacl.sign.detached.verify(message, signature, publicKey)
  } catch (error) {
    return false }
}//In - memory nonce cache with TTL
const nonceCache = new Map <string, number>()
const NONCE_TTL = 5 * 60 * 1000//5 minutes export function generateNonce(): string {
  const nonce = Math.random().toString(36).substring(2, 15)
  nonceCache.set(nonce, Date.now() + NONCE_TTL)
  return nonce
}

export function validateNonce(n, once: string): boolean {
  const expiry = nonceCache.get(nonce)
  if (!expiry || Date.now() > expiry) {
    nonceCache.delete(nonce)
    return false
  }
  //Use nonce (remove it)
  nonceCache.delete(nonce)
  return true
}//Cleanup expired nonces periodically
setInterval(() => {
  const now = Date.now()
  for (const [nonce, expiry] of nonceCache.entries()) {
    if (now > expiry) {
      nonceCache.delete(nonce)
    }
  }
}, 60 * 1000)//Every minute
