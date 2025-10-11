import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readJsonSafe, getEnvInt } from '@/lib/server/request';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try {
    const schema = z.object({
      bundle_id: z.string().min(1),
      status: z.enum(['success', 'failed', 'partial']).optional(),
      slot: z.number().int().nonnegative().optional(),
      signatures: z
        .array(z.string().min(44))
        .min(1)
        .max(getEnvInt('RECORD_MAX_SIGS', 20))
        .optional(),
    });
    await readJsonSafe(request, {
      maxBytes: getEnvInt('PAYLOAD_LIMIT_RECORD_BYTES', 16 * 1024),
      schema,
    });
    return NextResponse.json({ ok: true, received: true });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Failed to record bundle';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
