import { NextRequest } from 'next/server';
import { z } from 'zod';
// DB-backed trades endpoint disabled in this build

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
  return new Response(JSON.stringify({ items: [] }), {
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
  return new Response(JSON.stringify({ ok: false, error: 'unavailable' }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
