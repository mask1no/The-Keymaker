import { NextResponse } from 'next/server';
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
});

/**
 * POST /api/auth/verify
 * Verify SIWS signature and create session
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pubkey, signature, message } = VerifyRequestSchema.parse(body);
    
    // Verify signature
    const verification = verifySIWS({
      pubkey,
      signature,
      message,
    });
    
    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.error || 'Invalid signature' },
        { status: 401 }
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}