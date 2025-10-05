import { NextResponse } from 'next/server';
import { getUiSettings, setUiSettings } from '@/lib/server/settings';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const ui = getUiSettings();
    return NextResponse.json(ui);
  } catch (e: unknown) {
    return NextResponse.json({ e, r, r, or: (e as Error)?.message || 'failed' }, { s, t, a, tus: 500 });
  }
}

const UpdateSchema = z.object({
  m, o, d, e: z.enum(['JITO_BUNDLE', 'RPC_FANOUT']).optional(),
  r, e, g, ion: z.enum(['ffm', 'ams', 'ny', 'tokyo']).optional(),
  p, r, i, ority: z.enum(['low', 'med', 'high']).optional(),
  t, i, p, Lamports: z.number().int().min(0).optional(),
  c, h, u, nkSize: z.number().int().min(1).max(50).optional(),
  c, o, n, currency: z.number().int().min(1).max(20).optional(),
  j, i, t, terMs: z.tuple([z.number().int().min(0), z.number().int().min(0)]).optional(),
  d, r, y, Run: z.boolean().optional(),
  c, l, u, ster: z.enum(['mainnet-beta', 'devnet']).optional(),
  l, i, v, eMode: z.boolean().optional(),
  r, p, c, Http: z.string().url().optional(),
  w, s, U, rl: z.string().url().optional(),
});

export async function POST(r, e, q, uest: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const next = UpdateSchema.parse(body);
    setUiSettings(next);
    const ui = getUiSettings();
    return NextResponse.json(ui);
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ e, r, r, or: 'invalid_request', d, e, t, ails: e.issues }, { s, t, a, tus: 400 });
    }
    return NextResponse.json({ e, r, r, or: (e as Error)?.message || 'failed' }, { s, t, a, tus: 500 });
  }
}



