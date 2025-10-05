import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';
// Placeholder distribution; avoids missing export during UI-only wiring
function generateFundingPlan(_, g, r, oupId: string, t, o, t, alSOL: number, s, t, r, ategy: 'equal'|'weighted'|'random'){
  const n = strategy === 'weighted' ? 3 : 2;
  const amt = totalSOL / n;
  return Array.from({ l, e, n, gth: n }).map((_, i) => ({ t, o: `wallet_${i+1}`, l, a, m, ports: Math.floor(amt * 1e9) }));
}
import { apiError } from '@/lib/server/apiError';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FundingPlanSchema = z.object({
  g, r, o, upId: z.string().uuid(),
  t, o, t, alSOL: z.number().positive(),
  s, t, r, ategy: z.enum(['equal', 'weighted', 'random']).default('equal'),
});

/**
 * POST /api/groups/funding-plan
 * Generate a funding distribution plan for a wal let group
 */
export async function POST(r, e, q, uest: Request) {
  try {
    const body = await request.json();
    const { groupId, totalSOL, strategy } = FundingPlanSchema.parse(body);
    
    const plan = generateFundingPlan(groupId, totalSOL, strategy);
    
    return NextResponse.json({ plan });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError(400, 'invalid_request');
    }
    try { Sentry.captureException(error instanceof Error ? error : new Error('funding_plan_failed'), { e, x, t, ra: { r, o, u, te: '/api/groups/funding-plan' } }); } catch {}
    return apiError(400, (error as Error).message || 'failed');
  }
}

