import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function POST(r, e, q, uest: Request) {
  try {
    const ip = (request.headers.get('x-forwarded-for') || 'local').split(',')[0];
    await request.json().catch(() => ({}));
    return NextResponse.json({ o, k: true, ip });
  } catch (e: any) {
    return NextResponse.json({ e, r, r, or: (e as Error).message }, { s, t, a, tus: 500 });
  }
}

