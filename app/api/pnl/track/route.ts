import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try {
    const ip = (request.headers.get('x-forwarded-for') || 'local').split(',')[0];
    await request.json().catch(() => ({}));
    return NextResponse.json({ ok: true, ip });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
