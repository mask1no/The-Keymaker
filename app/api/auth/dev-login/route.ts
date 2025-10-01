import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { Keypair } from '@solana/web3.js';
import { setSessionCookie } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    let pubkey = 'DevUser';
    try {
      const keyPath = process.env.KEYPAIR_JSON || './keypairs/dev-payer.json';
      const raw = readFileSync(keyPath, 'utf8');
      const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
      pubkey = kp.publicKey.toBase58();
    } catch {
      // Fallback to ephemeral key
      const kp = Keypair.generate();
      pubkey = kp.publicKey.toBase58();
    }
    setSessionCookie(pubkey);
    return NextResponse.json({ ok: true, pubkey });
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}


