import { NextResponse } from 'next/server';
import { generateNonce } from '@/lib/auth/siws';
import { rateLimit } from '@/lib/server/rateLimit';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NonceRequestSchema = z.object({
  pubkey: z.string().min(32).max(44), // Base58 Solana pubkey
});

/**
 * POST /api/auth/nonce
 * Generate a nonce for SIWS challenge
 */
export async function POST(request: Request) {
  try {
    const rl = await rateLimit(
      (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'anon',
    );
    if (!rl) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
    }
    const body = await request.json();
    const { pubkey } = NonceRequestSchema.parse(body);

    const nonce = generateNonce(pubkey);

    return NextResponse.json({
      nonce,
      expiresIn: 300, // 5 minutes in seconds
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: 'Failed to generate nonce' }, { status: 500 });
  }
}
