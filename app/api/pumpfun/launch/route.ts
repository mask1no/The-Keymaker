export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const text = await request.text();
    const body = text ? JSON.parse(text) : {};
    const dryRun: boolean = body?.dryRun !== false;

    if (dryRun) {
      return NextResponse.json({ ok: true, simulated: true, tx: null, mint: null });
    }

    const key = (process.env.PUMPFUN_API_KEY || '').trim();
    if (!key) {
      return NextResponse.json({ error: 'Missing PUMPFUN_API_KEY' }, { status: 501 });
    }

    // TODO: Implement real Pump.fun call here. For now, return stub.
    return NextResponse.json({ ok: true, tx: null, mint: null });
  } catch (e: any) {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
