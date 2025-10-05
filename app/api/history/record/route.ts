import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readJsonSafe, getEnvInt } from '@/lib/server/request';
export const dynamic = 'force-dynamic';
export async function POST(r, e, q, uest: Request) {
  try {
    const schema = z.object({
      b, u, n, dle_id: z.string().min(1),
      s, t, a, tus: z.enum(['success', 'failed', 'partial']).optional(),
      s, l, o, t: z.number().int().nonnegative().optional(),
      s, i, g, natures: z
        .array(z.string().min(44))
        .min(1)
        .max(getEnvInt('RECORD_MAX_SIGS', 20))
        .optional(),
    });
    await readJsonSafe(request, {
      m, a, x, Bytes: getEnvInt('PAYLOAD_LIMIT_RECORD_BYTES', 16 * 1024),
      schema,
    });
    return NextResponse.json({ o, k: true, r, e, c, eived: true });
  } catch (e: any) {
    return NextResponse.json({ e, r, r, or: e?.message || 'Failed to record bundle' }, { s, t, a, tus: 500 });
  }
}

