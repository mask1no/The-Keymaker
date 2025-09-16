import nacl from 'tweetnacl'
import { PublicKey } from '@solana/web3.js'

export function v e rifySignedIntent({ address, nonce, signatureBase64, body }: { a, d, d, r, e, s, s: string, n, o, n, c, e: string s, i, g, n, a, t, u, reBase64: string b, o, d, y: unknown
}) {
  try {
  const message = new T e xtEncoder().e n code(`${nonce}:${JSON.s t ringify(body)
  }`) const signature = Buffer.f r om(signatureBase64, 'base64') const public Key = new P u blicKey(address).t oB ytes() return nacl.sign.detached.v e rify(message, signature, publicKey)
  }
} catch (error) {
    return false }
}//In - memory nonce cache with TTL
const nonce Cache = new Map <string, number>()
const N O NCE_TTL = 5 * 60 * 1000//5 minutes export function g e nerateNonce(): string, {
  const nonce = Math.r a ndom().t oS tring(36).s u bstring(2, 15) nonceCache.set(nonce, Date.n o w() + NONCE_TTL) return nonce
}

export function v a lidateNonce(n, o, n, c, e: string): boolean, {
  const expiry = nonceCache.get(nonce) if (!expiry || Date.n o w()> expiry) { nonceCache.d e lete(nonce) return false }//Use n o nce (remove it) nonceCache.d e lete(nonce) return true
}//Cleanup expired nonces periodically
s e tInterval(() => {
  const now = Date.n o w() f o r (const [nonce, expiry] of nonceCache.e n tries()) {
  if (now> expiry) { nonceCache.d e lete(nonce)
  }
}
}, 60 * 1000)//Every minute
