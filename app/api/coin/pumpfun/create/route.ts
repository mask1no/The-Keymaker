import { NextResponse } from 'next/server';
import { z } from 'zod';
import { VersionedTransaction, Connection } from '@solana/web3.js';
import { buildCreateMintTx } from '@/lib/tx/pumpfun';
import { getSession } from '@/lib/server/session';
import { rateLimit, getRateConfig } from '@/lib/server/rateLimit';

export const dynamic = 'force-dynamic';

const Body = z.object({
  devPubkey: z.string().min(32).max(44),
  name: z.string().min(1).max(32),
  symbol: z.string().min(1).max(10),
  supply: z.number().int().positive(),
  decimals: z.number().int().min(0).max(9).default(6),
  dryRun: z.boolean().default(true),
});

export async function POST(request: Request) {
  try {
    const fwd = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
    const cfg = getRateConfig('submit');
    const rl = await rateLimit(`coin:pumpfun_create:${fwd || 'anon'}`, cfg.limit, cfg.windowMs);
    if (!rl.allowed) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
    const session = getSession();
    const user = session?.userPubkey || '';
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const body = await request.json();
    const params = Body.parse(body);

    const tx = await buildCreateMintTx({
      devPubkey: params.devPubkey,
      name: params.name,
      symbol: params.symbol,
      supply: params.supply,
      decimals: params.decimals,
    });

    const rpc = process.env.HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com';
    const conn = new Connection(rpc, 'confirmed');
    const sim = await conn.simulateTransaction(tx, { sigVerify: false });
    if (params.dryRun) {
      return NextResponse.json({ ok: true, simulated: true, logs: sim.value.logs || [] });
    }

    const envLive = (process.env.KEYMAKER_ALLOW_LIVE || '').toUpperCase() === 'YES';
    const requireArming = (process.env.KEYMAKER_REQUIRE_ARMING || '').toUpperCase() === 'YES';
    if (!envLive) return NextResponse.json({ error: 'live_disabled' }, { status: 501 });
    if (requireArming) {
      const { isArmed } = await import('@/lib/server/arming');
      if (!isArmed()) return NextResponse.json({ error: 'not_armed' }, { status: 403 });
    }

    const sig = await conn.sendRawTransaction(tx.serialize(), { skipPreflight: false, maxRetries: 3 });
    return NextResponse.json({ ok: true, signature: sig });
  } catch (e: unknown) {
    const msg = (e as Error)?.message || 'failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


