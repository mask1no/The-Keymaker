import { NextRequest, NextResponse } from 'next/server';
import 'server-only';
import { z } from 'zod';
import { getSession } from '@/lib/server/session';
import { rateLimit, getRateConfig } from '@/lib/server/rateLimit';

const createSchema = z.object({
  name: z.string().min(1).max(32),
  symbol: z.string().min(1).max(10),
  uri: z.string().url(),
});

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { limit: rateLimitNum, windowMs } = getRateConfig('submit');
  const rateLimitResult = rateLimit(session.sub, rateLimitNum, windowMs);

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        remaining: rateLimitResult.remaining,
        resetAt: rateLimitResult.resetAt,
      },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();
    createSchema.parse(body);

    return NextResponse.json(
      {
        error: 'pumpfun_create_not_implemented',
        message:
          'pump.fun token creation is not yet implemented. Please provide the program/IDL you want to use, or create tokens directly at https://pump.fun and trade them here.',
      },
      { status: 501 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: 'pumpfun_create_not_implemented',
      },
      { status: 501 },
    );
  }
}
