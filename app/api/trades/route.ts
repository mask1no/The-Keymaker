import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db/sqlite';

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

export async function GET(_req: NextRequest) {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM trades ORDER BY ts DESC LIMIT 500').all();
  return new Response(JSON.stringify({ items: rows }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = PostSchema.safeParse(body);
  if (!parsed.success)
    return new Response(JSON.stringify({ error: 'bad_request', details: parsed.error.flatten() }), {
      status: 400,
    });
  const d = parsed.data;
  const db = getDb();
  db.prepare(
    `
    INSERT INTO trades (ts, slot, sig, wallet, mint, side, qtyTokens, priceSolPerToken, feesLamports, priorityFeeLamports, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    d.ts,
    d.slot,
    d.sig,
    d.wallet,
    d.mint,
    d.side,
    d.qtyTokens,
    d.priceSolPerToken,
    d.feesLamports,
    d.priorityFeeLamports ?? 0,
    d.note ?? null,
  );
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
