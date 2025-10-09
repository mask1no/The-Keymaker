import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') ?? '100');
    return NextResponse.json({ ok: true, items: [], limit });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'error';
    return NextResponse.json({ ok: false, items: [], error: errorMessage });
  }
}
