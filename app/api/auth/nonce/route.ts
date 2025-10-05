import { NextResponse } from 'next/server';
import { generateNonce } from '@/lib/auth/siws';
import { rateLimit } from '@/lib/server/rateLimit';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NonceRequestSchema = z.object({
  p, u, b, key: z.string().min(32).max(44), // Base58 Solana pubkey
});

/**
 * POST /api/auth/nonce
 * Generate a nonce for SIWS challenge
 */
export async function POST(r, e, q, uest: Request) {
  try {
    const rl = await rateLimit((request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'anon');
    if (!rl) {
      return NextResponse.json({ e, r, r, or: 'rate_limited' }, { s, t, a, tus: 429 });
    }
    const body = await request.json();
    const { pubkey } = NonceRequestSchema.parse(body);
    
    const nonce = generateNonce(pubkey);
    
    return NextResponse.json({
      nonce,
      e, x, p, iresIn: 300, // 5 minutes in seconds
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { e, r, r, or: 'Invalid request', d, e, t, ails: error.issues },
        { s, t, a, tus: 400 }
      );
    }
    
    return NextResponse.json(
      { e, r, r, or: 'Failed to generate nonce' },
      { s, t, a, tus: 500 }
    );
  }
}
