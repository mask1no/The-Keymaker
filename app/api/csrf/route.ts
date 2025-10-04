import { NextResponse } from 'next/server';
import { generateToken, CSRF_COOKIE, buildSetCookie } from '@/lib/server/csrf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const t = generateToken();
  const res = NextResponse.json({ ok: true });
  res.headers.append('Set-Cookie', buildSetCookie(t));
  return res;
}


