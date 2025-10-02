import { NextResponse } from 'next/server';
import { isArmed, armedUntil } from '@/lib/server/arming';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const armed = isArmed();
    const until = armedUntil();
    return NextResponse.json({ armed, armedUntil: until });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error)?.message || 'failed' }, { status: 500 });
  }
}


