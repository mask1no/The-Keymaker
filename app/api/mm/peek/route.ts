import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const s = getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const db = await (await import('@/lib/db')).db;
  const rows = await db.all('SELECT * FROM mm_queue WHERE status = ? ORDER BY id ASC LIMIT 50', [
    'pending',
  ]);
  return NextResponse.json({ pending: rows });
}
