import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';
import { apiError } from '@/lib/server/apiError';
import { getUiSettings } from '@/lib/server/settings';
import { rateLimit } from '@/lib/server/rateLimit';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  name: z.string().min(1).max(32),
  symbol: z.string().min(1).max(10),
  uri: z.string().url().optional(),
  initialSol: z.number().min(0).max(5).default(0),
  dryRun: z.boolean().optional(),
});

export async function POST(request: Request) {
  const requestId = randomUUID();
  try {
    const fwd = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
    const key = fwd || 'anon';
    if (!rateLimit(`pump:${key}`, 15, 5)) return apiError(429, 'rate_limited', requestId);
    const cl = Number(request.headers.get('content-length') || '0');
    if (cl > 8192) return apiError(413, 'payload_too_large', requestId);
    const text = await request.text();
    if (Buffer.byteLength(text || '', 'utf8') > 8192) return apiError(413, 'payload_too_large', requestId);
    const parsed = Body.parse(text ? JSON.parse(text) : {});
    const ui = getUiSettings();
    const dryRun = typeof parsed.dryRun === 'boolean' ? parsed.dryRun : (ui.dryRun ?? true);

    // Simulate-only build: return proof payload (no secrets)
    if (dryRun) {
      const proof = {
        name: parsed.name,
        symbol: parsed.symbol,
        uri: parsed.uri || null,
        initialSol: parsed.initialSol,
        corr: requestId,
      };
      return NextResponse.json({ ok: true, simulated: true, proof, requestId });
    }

    // Live path requires UI + env and optional arming
    const uiLive = ui.liveMode === true;
    const envLive = (process.env.KEYMAKER_ALLOW_LIVE || '').toUpperCase() === 'YES';
    if (!uiLive || !envLive) {
      return apiError(
        501,
        'live_disabled',
        requestId,
        'Enable Live Mode in Settings and set KEYMAKER_ALLOW_LIVE=YES to launch.',
      );
    }
    if (process.env.KEYMAKER_DISABLE_LIVE === 'YES') {
      return apiError(403, 'live_disabled', requestId, 'KEYMAKER_DISABLE_LIVE=YES blocks live sends.');
    }
    if (process.env.KEYMAKER_REQUIRE_ARMING === 'YES') {
      const { isArmed } = await import('@/lib/server/arming');
      if (!isArmed()) return apiError(403, 'not_armed', requestId, 'POST /api/ops/arm to proceed.');
    }

    // Placeholder: not wired to pump.fun in MVP
    return apiError(501, 'not_implemented', requestId, 'Pump.fun live launch not implemented.');
  } catch (e: unknown) {
    try {
      Sentry.captureException(e instanceof Error ? e : new Error('pump_launch_failed'), {
        extra: { route: '/api/pumpfun/launch' },
      });
    } catch {}
    return apiError(500, 'failed', requestId);
  }
}
