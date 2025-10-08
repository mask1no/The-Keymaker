import { NextRequest } from 'next/server';
import { z } from 'zod';
import { recordTrade, listTrades } from '@/lib/db/sqlite';
import { withSessionAndLimit } from '@/lib/api/withSessionAndLimit';

export const runtime = 'nodejs';

const PostSchema = z.object({
  ts: z.number().int().positive(),
  slot: z.number().int().nonnegative(),
  sig: z.string(),
  wallet: z.string(),
  mint: z.string(),
  side: z.enum(['buy', 'sell']),
  qtyTokens: z.string(),
  priceSolPerToken: z.number().nonnegative(),
  feesLamports: z.number().int().nonnegative(),
  priorityFeeLamports: z.number().int().nonnegative().optional(),
  note: z.string().optional(),
});

export async function GET(req: NextRequest) {
  return withSessionAndLimit(async (_req, _sid) => {
    const url = new URL(req.url);
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? Math.min(500, Math.max(1, parseInt(limitParam, 10))) : 500;

    const trades = listTrades({ limit, offset: 0 });

    return {
      items: trades.map((t) => ({
        id: t.id,
        ts: t.ts,
        slot: t.slot,
        signature: t.signature,
        wallet: t.wallet,
        mint: t.mint,
        side: t.side,
        qtyTokens: String(t.qty),
        priceSolPerToken: t.priceLamports / 1e9,
        feesLamports: t.feeLamports,
        priorityFeeLamports: t.priorityFeeLamports || 0,
      })),
    };
  })(req);
}

export async function POST(req: NextRequest) {
  return withSessionAndLimit(async (_req, _sid) => {
    const body = await req.json();
    const parsed = PostSchema.safeParse(body);

    if (!parsed.success) {
      throw new Error('bad_request');
    }

    const data = parsed.data;
    const qtyTokensFloat = parseFloat(data.qtyTokens);
    if (!Number.isFinite(qtyTokensFloat) || qtyTokensFloat < 0) {
      throw new Error('invalid_qty');
    }

    recordTrade({
      ts: data.ts,
      side: data.side,
      mint: data.mint,
      qty: Math.floor(qtyTokensFloat),
      priceLamports: Math.floor(data.priceSolPerToken * 1e9),
      feeLamports: data.feesLamports,
      priorityFeeLamports: data.priorityFeeLamports || 0,
      slot: data.slot,
      signature: data.sig,
      bundleId: null,
      wallet: data.wallet,
      groupId: null,
      mode: 'RPC',
    });

    return { ok: true };
  })(req);
}
