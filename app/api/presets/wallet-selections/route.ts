import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Upsert = z.object({
  id: z.string().min(3),
  groupId: z.string().min(3),
  name: z.string().min(1),
  walletPubkeys: z.array(z.string().min(32)).min(1),
});

export async function GET(request: Request) {
  try {
    const s = getSession();
    if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const url = new URL(request.url);
    const groupId = url.searchParams.get('groupId');
    const db = await getDb();
    const rows = groupId
      ? await db.all(
          'SELECT * FROM wallet_selection_presets WHERE group_id = ? ORDER BY updated_at DESC',
          [groupId],
        )
      : await db.all('SELECT * FROM wallet_selection_presets ORDER BY updated_at DESC');
    interface WalletSelectionPreset {
      id: string;
      group_id: string;
      [key: string]: unknown;
    }
    
    const presets = (rows || []).map((r: WalletSelectionPreset) => ({
      id: r.id,
      groupId: r.group_id,
      name: r.name,
      walletPubkeys: JSON.parse(r.wallet_pubkeys),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
    return NextResponse.json({ presets }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error)?.message || 'failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const s = getSession();
    if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const p = Upsert.parse(body);
    const db = await getDb();
    const now = Date.now();
    await db.run(
      'INSERT INTO wallet_selection_presets (id, group_id, name, wallet_pubkeys, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET group_id=excluded.group_id, name=excluded.name, wallet_pubkeys=excluded.wallet_pubkeys, updated_at=excluded.updated_at',
      [p.id, p.groupId, p.name, JSON.stringify(p.walletPubkeys), now, now],
    );
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if (e instanceof z.ZodError)
      return NextResponse.json({ error: 'invalid_request', details: e.issues }, { status: 400 });
    return NextResponse.json({ error: (e as Error)?.message || 'failed' }, { status: 500 });
  }
}
