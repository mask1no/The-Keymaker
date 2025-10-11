import { NextResponse } from 'next/server';
import 'server-only';
import { z } from 'zod';
import { withSessionAndLimit } from '@/lib/server/withSessionAndLimit';
import { recordTrade, listTrades } from '@/lib/db/sqlite';

export const GET = withSessionAndLimit(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '500'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');

    const trades = await listTrades({ limit, offset });

    return NextResponse.json({ trades });
  } catch (error) {
    // Failed to fetch trades
    return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 });
  }
});

const postSchema = z.object({
  ts: z.number().int().positive(),
  slot: z.number().int().nonnegative(),
  sig: z.string().min(1),
  wallet: z.string().min(1),
  mint: z.string().min(1),
  side: z.enum(['buy', 'sell']),
  qtyTokens: z.string(),
  priceSolPerToken: z.number().nonnegative(),
  feesLamports: z.number().int().nonnegative(),
  priorityFeeLamports: z.number().int().nonnegative().optional(),
  note: z.string().optional(),
});

export const POST = withSessionAndLimit(async (request) => {
  try {
    const body = await request.json();
    const validated = postSchema.parse(body);

    const qty = parseInt(validated.qtyTokens, 10);
    if (isNaN(qty) || qty < 0) {
      return NextResponse.json({ error: 'Invalid qtyTokens' }, { status: 400 });
    }

    const priceLamports = Math.round(validated.priceSolPerToken * 1e9);

    const tradeId = await recordTrade({
      ts: validated.ts,
      slot: validated.slot,
      sig: validated.sig,
      wallet: validated.wallet,
      mint: validated.mint,
      side: validated.side,
      qty,
      priceLamports,
      feeLamports: validated.feesLamports,
      priorityFeeLamports: validated.priorityFeeLamports,
      note: validated.note,
    });

    return NextResponse.json({ success: true, tradeId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 },
      );
    }
    // Failed to save trade
    return NextResponse.json({ error: 'Failed to save trade' }, { status: 500 });
  }
});
