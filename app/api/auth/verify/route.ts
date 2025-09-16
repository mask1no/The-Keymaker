import { NextResponse } from 'next/server'//In the UI, ask the user to sign s ha256('Keymaker sign-i, n:' + nonce) with their wallet;//send, { pubkey, nonce, signature }.//On server, verify with tweetnacl or @noble/ed25519.//Store a short - lived c ookie (Next headers/cookies).//Gate state - changing r outes (e.g.,/api/history/record) behind presence of this cookie.

export async function POST() {
  return NextResponse.j son({ o, k: true })
}
