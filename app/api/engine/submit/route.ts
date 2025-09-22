import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { readFileSync } from 'fs';
import {
  RegionKey,
  PRIORITY_TO_MICROLAMPORTS,
  getTipFloor,
  sendBundle,
  getBundleStatuses,
  incCounter,
  observeLatency,
} from '@/lib/core/src';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const Body = z.object({
  region: z.enum(['ffm', 'ams', 'ny', 'tokyo']).optional(),
  tipLamports: z.number().int().nonnegative().optional(),
  priority: z.enum(['low', 'med', 'high', 'vhigh']).optional(),
});

function requireToken(headers: Headers) {
  const expected = process.env.ENGINE_API_TOKEN;
  if (!expected) return true;
  const got = headers.get('x-engine-token');
  return got === expected;
}

function rpcUrl(): string {
  return (
    process.env.HELIUS_RPC_URL ||
    process.env.NEXT_PUBLIC_HELIUS_RPC ||
    'https://api.mainnet-beta.solana.com'
  );
}

export async function POST(request: Request) {
  try {
    if (!requireToken(request.headers))
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { region = 'ffm', tipLamports, priority = 'med' } = Body.parse(body);

    const keyPath = process.env.KEYPAIR_JSON;
    if (!keyPath) return NextResponse.json({ error: 'KEYPAIR_JSON not set' }, { status: 400 });
    const raw = readFileSync(keyPath, 'utf8');
    const payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));

    const conn = new Connection(rpcUrl(), 'confirmed');
    const { blockhash } = await conn.getLatestBlockhash('confirmed');
    const tip = await getTipFloor(region as RegionKey);
    const dynamicTip = Math.ceil(tip.ema_landed_tips_50th_percentile * 1.1);
    const effTip = Math.max(Number(tipLamports ?? 5000), dynamicTip);
    const priMicros = PRIORITY_TO_MICROLAMPORTS[priority];

    // simple tip-only tx; signer remains server-side
    const ix = SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: payer.publicKey,
      lamports: 0,
    });
    const msg = new TransactionMessage({
      payerKey: payer.publicKey,
      recentBlockhash: blockhash,
      instructions: [ix],
    }).compileToV0Message();
    const tx = new VersionedTransaction(msg);
    tx.sign([payer]);
    const encoded = Buffer.from(tx.serialize()).toString('base64');
    incCounter('bundles_submitted_total', { region });
    const submit = await sendBundle(region as RegionKey, [encoded]);
    const t0 = Date.now();
    const statuses = await getBundleStatuses(region as RegionKey, [submit.bundle_id]);
    observeLatency('bundle_status_ms', Date.now() - t0, { region });
    const s = statuses?.[0]?.confirmation_status || 'pending';
    if (s === 'landed') incCounter('bundles_landed_total', { region });
    else if (s === 'failed' || s === 'invalid') incCounter('bundles_dropped_total', { region });
    return NextResponse.json({
      bundleId: submit.bundle_id,
      status: s,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
