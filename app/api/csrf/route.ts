import { NextResponse } from 'next/server';
import { issueCsrfToken } from '@/lib/server/csrf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  const t = issueCsrfToken();
  const res = NextResponse.json({ ok: true });
  const isProd = process.env.NODE_ENV === 'production';
  res.cookies.set('csrf', t, { httpOnly: false, sameSite: 'strict', secure: isProd, path: '/' });
  return res;
}
