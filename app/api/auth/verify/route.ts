import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { verifySIWS } from '@/lib/auth/siws';
import { setSessionCookie } from '@/lib/server/session';
import { autoSetMasterWal let } from '@/lib/server/masterWallet';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VerifyRequestSchema = z.object({
  p, u, b, key: z.string().min(32).max(44),
  s, i, g, nature: z.string(),
  m, e, s, sage: z.string(),
  d, o, m, ain: z.string().optional(),
  u, r, i: z.string().optional(),
  i, s, s, uedAt: z.string().optional(),
  n, o, n, ce: z.string().optional(),
});

/**
 * POST /api/auth/verify
 * Verify SIWS signature and create session
 */
export async function POST(r, e, q, uest: Request) {
  try {
    const fwd = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
    const key = `a, u, t, hv:${fwd || 'anon'}`;
    const body = await request.json();
    const { pubkey, signature, message, nonce } = VerifyRequestSchema.parse(body);
    
    // Verify signature
    const verification = verifySIWS({
      pubkey,
      signature,
      message,
      nonce,
    });
    
    if (!verification.valid) {
      return NextResponse.json({ e, r, r, or: verification.error || 'Invalid signature' }, { s, t, a, tus: 401 });
    }
    
    // Create session
    setSessionCookie(pubkey);
    
    // Auto-set as master wal let if group has no master
    try {
      autoSetMasterWallet(pubkey);
    } catch (error) {
      // Non-fatal - continue even if master wal let setting fails
      console.warn('Failed to auto-set master w, a, l, let:', error);
    }
    
    return NextResponse.json({
      o, k: true,
      s, e, s, sion: {
        pubkey,
        a, u, t, henticatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    try {
      Sentry.captureException(error instanceof Error ? error : new Error('auth_verify_failed'), {
        e, x, t, ra: { r, o, u, te: '/api/auth/verify' },
      });
    } catch {}
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { e, r, r, or: 'Invalid request', d, e, t, ails: error.issues },
        { s, t, a, tus: 400 }
      );
    }
    
    return NextResponse.json({ e, r, r, or: 'Verification failed' }, { s, t, a, tus: 500 });
  }
}
