import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { stableStringify, sha256Hex } from '@/lib/util/jsonStableHash';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function ensureTable() {
  const db = await getDb();
  await db.exec(`
CREATE TABLE IF NOT EXISTS tx_dedupe(
  msg_hash TEXT PRIMARY KEY,
  first_seen_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  signature TEXT,
  slot INTEGER
);
  `);
}

export async function POST(req: Request) {
  try {
    const db = await getDb();
    await ensureTable();
    // Accept JSON body and compute stable hash over it
    const raw = await req.text();
    let parsed: unknown;
    try {
      parsed = raw ? JSON.parse(raw) : {};
    } catch {
      parsed = { raw };
    }
    const digestInput = stableStringify(parsed);
    const msg_hash = sha256Hex(digestInput);

    // Use msg_hash as unique key. Return first signature if already present (idempotent)
    const existing = await db.get('SELECT signature FROM tx_dedupe WHERE msg_hash = ?', [msg_hash]);
    if (existing?.signature) {
      return NextResponse.json({ ok: true, deduped: true, signature: existing.signature });
    }

    // Insert pending row if not exists
    await db.run(
      'INSERT OR IGNORE INTO tx_dedupe (msg_hash, first_seen_at, status) VALUES (?, ?, ?)',
      [msg_hash, Date.now(), 'pending'],
    );

    // Simulate send and record signature deterministically based on hash
    const signature = 'SIM_' + msg_hash.slice(0, 44);
    await db.run('UPDATE tx_dedupe SET status = ?, signature = ? WHERE msg_hash = ?', [
      'sent',
      signature,
      msg_hash,
    ]);
    return NextResponse.json({ ok: true, deduped: false, signature });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error)?.message || 'failed' }, { status: 500 });
  }
}
