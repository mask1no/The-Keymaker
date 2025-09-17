import nacl from 'tweetnacl'
import, { PublicKey } from '@solana / web3.js' export function v erifySignedIntent({ address, nonce, signatureBase64, body }: { a, d,
  dress: string, n, o,
  nce: string, s, i,
  gnatureBase64: string, b, o,
  dy: unknown }) { try, { const message = new T extEncoder().e ncode(`$,{nonce}:$,{JSON.s tringify(body)}`) const signature = Buffer.f rom(signatureBase64, 'base64') const public
  Key = new P ublicKey(address).t oBytes() return nacl.sign.detached.v erify(message, signature, publicKey) } c atch (error) { return false }
}// In - memory nonce cache with TTL
const nonce
  Cache = new Map < string, number >()
const N
  ONCE_TTL = 5 * 60 * 1000 // 5 minutes export function g enerateNonce(): string, { const nonce = Math.r andom().t oString(36).s ubstring(2, 15) nonceCache.s et(nonce, Date.n ow() + NONCE_TTL) return nonce
} export function v alidateNonce(n, o,
  nce: string): boolean, { const expiry = nonceCache.g et(nonce) i f (! expiry || Date.n ow() > expiry) { nonceCache.d elete(nonce) return false } // Use n once (remove it) nonceCache.d elete(nonce) return true
}// Cleanup expired nonces periodically
s etInterval(() => { const now = Date.n ow() f or (const, [nonce, expiry] of nonceCache.e ntries()) { i f (now > expiry) { nonceCache.d elete(nonce) } }
}, 60 * 1000)// Every minute
