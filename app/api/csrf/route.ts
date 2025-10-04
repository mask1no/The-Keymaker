import { NextResponse } from 'next/server';
import { issueCsrfToken } from '@/lib/server/csrf';

export const runtime='nodejs'; export const dynamic='force-dynamic';
export async function GET(){ const t=issueCsrfToken(); const res=NextResponse.json({ok:true}); res.cookies.set('csrf', t, { httpOnly:false, sameSite:'strict', secure:true, path:'/' }); return res; }


