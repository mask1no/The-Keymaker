import { NextResponse } from 'next/server';
import { arm, armedUntil } from '@/lib/server/arming';
import { rateLimit } from '@/lib/server/rateLimit';
import { apiError } from '@/lib/server/apiError';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function requireToken(headers: Headers) {
  const expected = process.env.ENGINE_API_TOKEN;
  if (!expected) return true;
  const got = headers.get('x-engine-token');
  return got === expected;
}

export async function POST(request: Request) {
  if (!requireToken(request.headers)) return apiError(401, 'unauthorized');
  if (request.method !== 'POST') return apiError(405, 'method_not_allowed');
  const fwd = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  const key = fwd || 'anon';
  if (!rateLimit(key)) return apiError(429, 'rate_limited');
  if (process.env.KEYMAKER_ALLOW_LIVE !== 'YES') return apiError(403, 'forbidden');
  const raw = await request.text();
  const body = raw ? JSON.parse(raw) : {};
  const minutes = Number(body?.minutes || 15);
  const ok = arm(minutes);
  if (!ok) return apiError(403, 'forbidden');
  return NextResponse.json({ armedUntil: armedUntil() });
}


