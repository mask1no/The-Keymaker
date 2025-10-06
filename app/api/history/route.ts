import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') ?? '100');
    return NextResponse.json({ ok: true, items: [], limit });
  } catch (e: any) {
    return NextResponse.json({ ok: false, items: [], error: e?.message ?? 'error' });
  }
}
