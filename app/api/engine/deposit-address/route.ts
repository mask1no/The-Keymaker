import { NextResponse } from 'next/server';
import { Keypair } from '@solana/web3.js';
import { readFileSync } from 'fs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function loadKeypairPath(): string | null {
  const p = process.env.KEYPAIR_JSON || null;
  return p;
}

export async function GET() {
  try {
    const keyPath = loadKeypairPath();
    if (!keyPath) return NextResponse.json({ error: 'Not configured' }, { status: 400 });
    const raw = readFileSync(keyPath, 'utf8');
    const arr = JSON.parse(raw);
    const kp = Keypair.fromSecretKey(Uint8Array.from(arr));
    return NextResponse.json({ publicKey: kp.publicKey.toBase58() });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
