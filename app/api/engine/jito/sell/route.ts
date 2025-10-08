import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { withSessionAndLimit } from '@/lib/api/withSessionAndLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JitoSellSchema = z.object({
  groupId: z.string().uuid(),
  mint: z.string().min(32).max(44),
  percent: z.number().min(1).max(100).default(100),
  slippageBps: z.number().min(0).max(10000).default(150),
  tipLamports: z.number().min(0).optional(),
  region: z.enum(['ny', 'ams', 'ffm', 'tokyo']).default('ny'),
  chunkSize: z.number().min(1).max(5).default(5),
  dryRun: z.boolean().default(true),
  cluster: z.enum(['mainnet-beta', 'devnet']).default('mainnet-beta'),
});

export const POST = withSessionAndLimit(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const p = JitoSellSchema.parse(body);
  return {
    mode: 'RPC_FANOUT',
    runId: `${Date.now().toString(36)}:${p.groupId}`,
    outcomes: [],
    dryRun: true,
    timestamp: new Date().toISOString(),
  } as any;
});
