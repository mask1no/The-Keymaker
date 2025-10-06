import { NextResponse } from 'next/server';
import { z } from 'zod';
import { submitJitoTurbo } from '@/lib/server/jitoService';
import { getSession } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Schema = z.object({
  signedTxBase64: z.string().min(1),
  tipLamports: z.number().int().nonnegative(),
  region: z.enum(['ffm', 'ams', 'ny', 'tokyo']).default('ffm'),
});

export async function POST(req: Request) {
  try {
    const s = getSession();
    if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const payload = await req.json();
    const { signedTxBase64, tipLamports, region } = Schema.parse(payload);
    const result = await submitJitoTurbo({ region, signedTxBase64, tipLamports });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json(result);
  } catch (e: unknown) {
    if (e instanceof z.ZodError)
      return NextResponse.json({ error: 'invalid_request', details: e.issues }, { status: 400 });
    return NextResponse.json({ error: (e as Error)?.message || 'failed' }, { status: 500 });
  }
}
