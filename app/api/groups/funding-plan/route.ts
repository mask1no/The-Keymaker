import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';
// Placeholder distribution; avoids missing export during UI-only wiring
function generateFundingPlan(_groupId: string, totalSOL: number, strategy: 'equal'|'weighted'|'random'){
  const n = strategy === 'weighted' ? 3 : 2;
  const amt = totalSOL / n;
  return Array.from({ length: n }).map((_, i) => ({ to: `wallet_${i+1}`, lamports: Math.floor(amt * 1e9) }));
}
import { apiError } from '@/lib/server/apiError';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FundingPlanSchema = z.object({
  groupId: z.string().uuid(),
  totalSOL: z.number().positive(),
  strategy: z.enum(['equal', 'weighted', 'random']).default('equal'),
});

/**
 * POST /api/groups/funding-plan
 * Generate a funding distribution plan for a wallet group
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { groupId, totalSOL, strategy } = FundingPlanSchema.parse(body);
    
    const plan = generateFundingPlan(groupId, totalSOL, strategy);
    
    return NextResponse.json({ plan });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError(400, 'invalid_request');
    }
    try { Sentry.captureException(error instanceof Error ? error : new Error('funding_plan_failed'), { extra: { route: '/api/groups/funding-plan' } }); } catch {}
    return apiError(400, (error as Error).message || 'failed');
  }
}
