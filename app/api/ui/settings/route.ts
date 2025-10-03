import { NextResponse } from 'next/server';
import { getUiSettings, setUiSettings } from '@/lib/server/settings';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const ui = getUiSettings();
    return NextResponse.json(ui);
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error)?.message || 'failed' }, { status: 500 });
  }
}

const UpdateSchema = z.object({
  mode: z.enum(['JITO_BUNDLE', 'RPC_FANOUT']).optional(),
  region: z.enum(['ffm', 'ams', 'ny', 'tokyo']).optional(),
  priority: z.enum(['low', 'med', 'high']).optional(),
  tipLamports: z.number().int().min(0).optional(),
  chunkSize: z.number().int().min(1).max(50).optional(),
  concurrency: z.number().int().min(1).max(20).optional(),
  jitterMs: z.tuple([z.number().int().min(0), z.number().int().min(0)]).optional(),
  dryRun: z.boolean().optional(),
  cluster: z.enum(['mainnet-beta', 'devnet']).optional(),
  liveMode: z.boolean().optional(),
  rpcHttp: z.string().url().optional(),
  wsUrl: z.string().url().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const next = UpdateSchema.parse(body);
    setUiSettings(next);
    const ui = getUiSettings();
    return NextResponse.json(ui);
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'invalid_request', details: e.issues }, { status: 400 });
    }
    return NextResponse.json({ error: (e as Error)?.message || 'failed' }, { status: 500 });
  }
}


