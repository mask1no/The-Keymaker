import { NextResponse } from 'next/server';
import { isArmed, armedUntil } from '@/lib/server/arming';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const armed = isArmed();
    const until = armedUntil();
    const allowLive = (process.env.KEYMAKER_ALLOW_LIVE || '').toUpperCase() === 'YES';
    const requireArming = (process.env.KEYMAKER_REQUIRE_ARMING || '').toUpperCase() === 'YES';
    const dryDefault = (process.env.DRY_RUN_DEFAULT || 'YES').toUpperCase() === 'YES';
    return NextResponse.json({ armed, armedUntil: until, allowLive, requireArming, dryDefault });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error)?.message || 'failed' }, { status: 500 });
  }
}


