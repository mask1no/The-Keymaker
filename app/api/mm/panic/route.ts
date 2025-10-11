import { NextResponse } from 'next/server';
import { getSession } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const s = getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const db = await (await import('@/lib/db')).db;
  await db.exec("UPDATE mm_queue SET status = 'cancelled' WHERE status IN ('pending','running')");
  return NextResponse.json({ ok: true });
}
