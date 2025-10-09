import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionFromCookies } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BundleBuySchema = z.object({
  groupId: z.string().uuid(),
  mint: z.string().min(32).max(44),
  amountSol: z.number().positive(),
  slippageBps: z.number().min(0).max(10000).default(150),
  tipLamports: z.number().min(0).optional(),
  region: z.enum(['ny', 'ams', 'ffm', 'tokyo']).default('ffm'),
  dryRun: z.boolean().default(true),
  chunkSize: z.number().min(1).max(10).default(5),
});

export async function POST(request: Request) {
  try {
    const session = getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const params = BundleBuySchema.parse(body);

    // For now, return a simulated response
    return NextResponse.json({
      success: true,
      simulated: params.dryRun,
      message: params.dryRun ? 'Bundle buy simulated successfully' : 'Bundle buy submitted',
      bundleId: `bundle_${Date.now()}`,
      wallets: 5, // Mock wallet count
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 },
      );
    }

    // Bundle buy error
    return NextResponse.json({ error: 'Bundle buy failed' }, { status: 500 });
  }
}
