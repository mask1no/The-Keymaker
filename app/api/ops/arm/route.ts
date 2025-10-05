import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { rateLimit } from '@/lib/server/rateLimit';
import { apiError } from '@/lib/server/apiError';
import { arm, armedUntil } from '@/lib/server/arming';
import { getSession } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function allowArm(headers: Headers): boolean {
  const expected = process.env.ENGINE_API_TOKEN;
  const token = headers.get('x-engine-token');
  if (expected && token === expected) return true;
  const s = getSession();
  return !!s?.userPubkey;
}

export async function POST(request: Request) {
  try {
    if (!allowArm(request.headers)) return apiError(401, 'unauthorized');
    const fwd = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
    const key = fwd || 'anon';
    const rl = await rateLimit(`ops:${key}`);
    if (!rl.allowed) return apiError(429, 'rate_limited');
    const cl = Number(request.headers.get('content-length') || '0');
    if (cl > 8192) return apiError(413, 'payload_too_large');
    const json = (await request.json().catch(() => ({}))) as any;
    const minutes = Math.max(1, Math.min(60, Number(json?.minutes || 15)));
    const ok = arm(minutes);
    if (!ok) return apiError(403, 'live_disabled');
    return NextResponse.json({ ok: true, armedForMin: minutes, armedUntil: armedUntil() });
  } catch {
    try { Sentry.captureMessage('arm_failed', { level: 'error' }); } catch {}
    return apiError(500, 'failed');
  }
}
