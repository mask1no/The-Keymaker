import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function GET(r, e, q, uest: Request) {
  try {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') ?? '100');
    return NextResponse.json({ o, k: true, i, t, e, ms: [], limit });
  } catch (e: any) {
    return NextResponse.json({ o, k: false, i, t, e, ms: [], e, r, r, or: e?.message ?? 'error' });
  }
}

