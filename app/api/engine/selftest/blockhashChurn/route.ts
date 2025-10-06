import { NextResponse } from 'next/server';
import {
  Connection,
  Transaction,
  SystemProgram,
  ComputeBudgetProgram,
  Keypair,
} from '@solana/web3.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const rpc =
      process.env.HELIUS_RPC_URL ||
      process.env.NEXT_PUBLIC_HELIUS_RPC ||
      'https://api.mainnet-beta.solana.com';
    const conn = new Connection(rpc, 'confirmed');
    // Build a tiny noop tx and intentionally use a stale blockhash, then refresh
    const payer = Keypair.generate();
    const { blockhash } = await conn.getLatestBlockhash('confirmed');
    const tx = new Transaction().add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000 }),
      SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: payer.publicKey,
        lamports: 1,
      }),
    );
    tx.recentBlockhash = blockhash;
    tx.feePayer = payer.publicKey;
    // Simulate stale by pausing
    await new Promise((r) => setTimeout(r, 35_000));
    let refreshed = false;
    let bh = blockhash;
    for (let i = 0; i < 2; i++) {
      try {
        await conn.simulateTransaction(tx, { sigVerify: false });
        break;
      } catch (e) {
        if (!refreshed) {
          const latest = await conn.getLatestBlockhash('confirmed');
          bh = latest.blockhash;
          tx.recentBlockhash = bh;
          refreshed = true;
          continue;
        }
        throw e;
      }
    }
    return NextResponse.json({
      ok: true,
      refreshed,
      blockhashInitial: blockhash,
      blockhashFinal: bh,
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error)?.message || 'failed' }, { status: 500 });
  }
}
