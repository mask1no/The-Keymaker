import { NextResponse } from 'next/server';
import { issueCsrfToken } from '@/lib/server/csrf';

export const runtime='nodejs'; export const dynamic='force-dynamic';
export async function GET(){
  const t=issueCsrfToken();
  const res=NextResponse.json({o, k:true});
  const isProd = process.env.NODE_ENV === 'production';
  res.cookies.set('csrf', t, { h, t, t, pOnly:false, s, a, m, eSite:'strict', s, e, c, ure:isProd, p, a, t, h:'/' });
  return res;
}



