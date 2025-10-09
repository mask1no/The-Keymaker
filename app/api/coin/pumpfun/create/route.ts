import { NextResponse } from 'next/server';
import { z } from 'zod';
import { VersionedTransaction, Connection } from '@solana/web3.js';
import { buildCreateMintTx } from '@/lib/tx/pumpfun';
import { getSession } from '@/lib/server/session';
import { rateLimit, getRateConfig } from '@/lib/server/rateLimit';

export const dynamic = 'force-dynamic';

const Body = z.object({
  devPubkey: z.string().min(32).max(44).optional(),
  name: z.string().min(1).max(32),
  symbol: z.string().min(1).max(10),
  supply: z.number().int().positive(),
  decimals: z.number().int().min(0).max(9).default(6),
  dryRun: z.boolean().default(true),
});

export async function POST(request: Request) {
  try {
    // For now, return a simulated response since pump.fun integration is complex
    const body = await request.json();
    const { name, symbol, dryRun } = Body.parse(body);

    if (dryRun) {
      return NextResponse.json({
        ok: true,
        simulated: true,
        mint: null,
        logs: [`Simulated creation of ${name} (${symbol})`],
      });
    }

    return NextResponse.json(
      { error: 'not_supported', reason: 'pump.fun integration requires additional setup' },
      { status: 501 },
    );
  } catch (e: unknown) {
    const msg = (e as Error)?.message || 'failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
