import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const db = await getDb();
    const msg = await req.text();
    const hash = Buffer.from(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(msg)),
    ).toString();
    const row = await db.get('SELECT * FROM tx_dedupe WHERE msgHash = ?', [hash]);
    if (row && row.signature) {
      return NextResponse.json({ ok: true, deduped: true, signature: row.signature });
    }
    if (!row) {
      await db.run('INSERT INTO tx_dedupe (msgHash, firstSeenAt, status) VALUES (?, ?, ?)', [
        hash,
        Date.now(),
        'pending',
      ]);
    }
    // Simulate send and record signature deterministically based on hash
    const signature = 'SIM_' + hash.slice(0, 44);
    await db.run('UPDATE tx_dedupe SET status = ?, signature = ? WHERE msgHash = ?', [
      'sent',
      signature,
      hash,
    ]);
    return NextResponse.json({ ok: true, deduped: false, signature });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error)?.message || 'failed' }, { status: 500 });
  }
}
