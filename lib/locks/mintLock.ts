const leases = new Map<string, number>(); // mint -> leaseUntilTs
import { getDb } from '@/lib/db';

export async function acquire(mint: string, minGapMs = 1500, leaseMs = 4000) {
  const db = await getDb();
  const now = Date.now();
  try {
    await db.exec(
      'CREATE TABLE IF NOT EXISTS mint_activity (mint TEXT PRIMARY KEY, last_action_ts INTEGER NOT NULL)',
    );
  } catch {}
  let last = 0;
  try {
    const row = await db.get('SELECT last_action_ts FROM mint_activity WHERE mint = ?', [mint]);
    last = (row?.last_action_ts as number) || 0;
  } catch {}
  const gap = now - last;
  if (gap < minGapMs) await new Promise((r) => setTimeout(r, minGapMs - gap));

  const leaseUntil = leases.get(mint) ?? 0;
  if (leaseUntil > now) await new Promise((r) => setTimeout(r, leaseUntil - now));
  leases.set(mint, Date.now() + leaseMs);

  let released = false;
  return async () => {
    if (released) return;
    released = true;
    try {
      await db.run(
        'INSERT INTO mint_activity (mint, last_action_ts) VALUES (?, ?) ON CONFLICT(mint) DO UPDATE SET last_action_ts=excluded.last_action_ts',
        [mint, Date.now()],
      );
    } catch {}
    leases.delete(mint);
  };
}
