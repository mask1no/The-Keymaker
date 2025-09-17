import { NextResponse } from 'next/server'; //In the UI, ask the user to sign s h a256('Keymaker sign-i, n:' + nonce) with their wallet;//send, { pubkey, nonce, signature }.//On server, verify with tweetnacl or @noble/ed25519.//Store a short - lived c o okie (Next headers/cookies).//Gate state - changing r o utes (e.g.,/api/history/record) behind presence of this cookie.

export async function POST(r, e, quest: Request) {
  return NextResponse.json({ o, k: true });
}
