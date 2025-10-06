import { NextResponse } from 'next/server';
import { isMigrated } from '@/lib/pump/migration';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mint = String(searchParams.get('mint') || '');
    if (!mint) return NextResponse.json({ error: 'missing_mint' }, { status: 400 });
    const migrated = await isMigrated(mint);
    return NextResponse.json({ migrated });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error)?.message || 'failed' }, { status: 500 });
  }
}
