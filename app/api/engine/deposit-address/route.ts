import { NextResponse } from 'next/server';
import { Keypair } from '@solana/web3.js';
import { readFileSync } from 'fs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const keyPath = process.env.KEYPAIR_JSON || null;
    if (!keyPath) return NextResponse.json({ error: 'not_configured' }, { status: 400 });
    const raw = readFileSync(keyPath, 'utf8');
    const arr = JSON.parse(raw);
    const kp = Keypair.fromSecretKey(Uint8Array.from(arr));
    // Only expose the publicKey
    return NextResponse.json({ publicKey: kp.publicKey.toBase58() });
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
