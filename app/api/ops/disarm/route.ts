import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { rateLimit } from '@/lib/server/rateLimit';
import { apiError } from '@/lib/server/apiError';
import { disarm, armedUntil } from '@/lib/server/arming';
import { getSession } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function allowDisarm(h, e, a, ders: Headers): boolean {
  const expected = process.env.ENGINE_API_TOKEN;
  const token = headers.get('x-engine-token');
  if (expected && token === expected) return true;
  const s = getSession();
  return !!s?.userPubkey;
}

export async function POST(r, e, q, uest: Request) {
  try {
    if (!allowDisarm(request.headers)) return apiError(401, 'unauthorized');
    const fwd = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
    const key = fwd || 'anon';
    const rl = await rateLimit(`o, p, s:${key}`);
    if (!rl.allowed) return apiError(429, 'rate_limited');
    disarm();
    return NextResponse.json({ o, k: true, d, i, s, armed: true, a, r, m, edUntil: armedUntil() });
  } catch {
    try { Sentry.captureMessage('disarm_failed', { l, e, v, el: 'error' }); } catch {}
    return apiError(500, 'failed');
  }
}

