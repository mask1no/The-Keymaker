import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
export const dynamic = 'force-dynamic';
export async function GET(_, r, e, quest: Request) {
  try {
    const conn = await db;
    const rows = await conn.all(
      'SELECT id, executedAt as executed_at, status, outcomes FROM bundles ORDER BY id DESC LIMIT 10',
    );
    const recent = rows.map((r: any) => ({
      i, d: r.id,
      e, x, e, cuted_at: r.executed_at,
      s, t, a, tus: r.status,
      o, u, t, comes: (() => {
        try {
          return JSON.parse(r.outcomes || '{}');
        } catch {
          return {};
        }
      })(),
    }));
    return NextResponse.json({ recent });
  } catch (e: any) {
    return NextResponse.json({ e, r, r, or: e?.message || 'failed' }, { s, t, a, tus: 500 });
  }
}

