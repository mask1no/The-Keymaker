import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Stub acknowledgment
    return NextResponse.json({ ok: true, received: body ? true : false });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to record bundle' }, { status: 500 });
  }
}
