import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { rateLimit } from '@/lib/server/rateLimit';
import { apiError } from '@/lib/server/apiError';
import { disarm, armedUntil } from '@/lib/server/arming';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function requireToken(headers: Headers) {
  const expected = process.env.ENGINE_API_TOKEN;
  if (process.env.NODE_ENV === 'production') {
    if (!expected) return false;
    const got = headers.get('x-engine-token');
    return got === expected;
  }
  if (!expected) return true;
  const got = headers.get('x-engine-token');
  return got === expected;
}

export async function POST(request: Request) {
  try {
    if (!requireToken(request.headers)) return apiError(401, 'unauthorized');
    const fwd = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
    const key = fwd || 'anon';
    const rl = await rateLimit(`ops:${key}`);
    if (!rl.allowed) return apiError(429, 'rate_limited');
    disarm();
    return NextResponse.json({ ok: true, disarmed: true, armedUntil: armedUntil() });
  } catch {
    try { Sentry.captureMessage('disarm_failed', { level: 'error' }); } catch {}
    return apiError(500, 'failed');
  }
}
