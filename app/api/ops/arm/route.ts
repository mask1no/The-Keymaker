import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/server/rateLimit';
import { apiError } from '@/lib/server/apiError';
import { arm, armedUntil } from '@/lib/server/arming';

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
    if (!rateLimit(`ops:${key}`, 10, 5)) return apiError(429, 'rate_limited');
    const cl = Number(request.headers.get('content-length') || '0');
    if (cl > 8192) return apiError(413, 'payload_too_large');
    const json = (await request.json().catch(() => ({}))) as any;
    const minutes = Math.max(1, Math.min(60, Number(json?.minutes || 15)));
    const ok = arm(minutes);
    if (!ok) return apiError(403, 'live_disabled');
    return NextResponse.json({ ok: true, armedForMin: minutes, armedUntil: armedUntil() });
  } catch {
    return apiError(500, 'failed');
  }
}
