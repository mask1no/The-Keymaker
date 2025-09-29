import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateFundingPlan } from '@/lib/server/walletGroups';

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
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
