import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  groupId: z.string().uuid(),
  items: z
    .array(
      z.object({
        wallet: z.string().min(32).max(44),
        mint: z.string().min(32).max(44),
        side: z.enum(['buy', 'sell']),
        buyLamports: z.number().int().optional(),
        sellTokens: z.number().int().optional(),
        slippageBps: z.number().int().min(1).max(10000),
        turbo: z.boolean().default(false),
        tipLamports: z.number().int().nonnegative().default(0),
        priorityFeeMicrolamports: z.number().int().nonnegative().default(0),
      }),
    )
    .min(1),
});

export async function POST(req: Request) {
  try {
    const s = getSession();
    if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const payload = Body.parse(await req.json());
    const db = await (await import('@/lib/db')).db;
    const now = Date.now();
    for (const it of payload.items) {
      await db.run(
        `INSERT INTO mm_queue (createdAt, groupId, wallet, mint, side, buyLamports, sellTokens, slippageBps, turbo, tipLamports, priorityFeeMicrolamports, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          now,
          payload.groupId,
          it.wallet,
          it.mint,
          it.side,
          it.buyLamports ?? null,
          it.sellTokens ?? null,
          it.slippageBps,
          it.turbo ? 1 : 0,
          it.tipLamports,
          it.priorityFeeMicrolamports,
        ],
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if (e instanceof z.ZodError)
      return NextResponse.json({ error: 'invalid_request', details: e.issues }, { status: 400 });
    return NextResponse.json({ error: (e as Error)?.message || 'failed' }, { status: 500 });
  }
}
