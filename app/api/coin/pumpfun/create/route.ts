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
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, symbol } = Body.parse(body);

    // Use PumpPortal for creation:
    const pumpPortalUrl = process.env.PUMPPORTAL_ENDPOINT || 'https://api.pumpportal.fun';
    const response = await fetch(`${pumpPortalUrl}/create`, {
      method: 'POST',
      body: JSON.stringify({ name, symbol /* metadataUri, etc. */ }),
    });
    if (!response.ok) throw new Error('Creation failed');
    // Parse mint from response

    return NextResponse.json(
      { error: 'not_supported', reason: 'pump.fun integration requires additional setup' },
      { status: 501 },
    );
  } catch (e: unknown) {
    const msg = (e as Error)?.message || 'failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
