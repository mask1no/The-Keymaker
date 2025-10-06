import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { verifySIWS } from '@/lib/auth/siws';
import { setSessionCookie } from '@/lib/server/session';
import { autoSetMasterWallet } from '@/lib/server/masterWallet';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VerifyRequestSchema = z.object({
  pubkey: z.string().min(32).max(44),
  signature: z.string(),
  message: z.string(),
  domain: z.string().optional(),
  uri: z.string().optional(),
  issuedAt: z.string().optional(),
  nonce: z.string().optional(),
});

/**
 * POST /api/auth/verify
 * Verify SIWS signature and create session
 */
export async function POST(request: Request) {
  try {
    const fwd = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
    const key = `authv:${fwd || 'anon'}`;
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
      return NextResponse.json(
        { error: verification.error || 'Invalid signature' },
        { status: 401 },
      );
    }

    // Create session
    setSessionCookie(pubkey);

    // Auto-set as master wallet if group has no master
    try {
      autoSetMasterWallet(pubkey);
    } catch (error) {
      // Non-fatal - continue even if master wallet setting fails
      console.warn('Failed to auto-set master wallet:', error);
    }

    return NextResponse.json({
      ok: true,
      session: {
        pubkey,
        authenticatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    try {
      Sentry.captureException(error instanceof Error ? error : new Error('auth_verify_failed'), {
        extra: { route: '/api/auth/verify' },
      });
    } catch {}

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
