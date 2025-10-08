const leases = new Map<string, number>(); // mint -> leaseUntilTs

async function nowMs() {
  return Date.now();
}

// minimal DB helpers (use better-sqlite3 adapter)
import { getDb } from '@/lib/db/sqlite';

export async function acquire(mint: string, minGapMs = 1500, leaseMs = 4000) {
  const db = getDb();
  const now = await nowMs();
  // enforce min gap across crashes
  const row = db.prepare('SELECT last_action_ts FROM mint_activity WHERE mint=?').get(mint) as
    | { last_action_ts?: number }
    | undefined;
  const last = row?.last_action_ts ?? 0;
  const gap = now - last;
  if (gap < minGapMs) await new Promise((r) => setTimeout(r, minGapMs - gap));

  // process-local lease
  const lease = leases.get(mint) ?? 0;
  if (lease > now) {
    await new Promise((r) => setTimeout(r, lease - now));
  }
  leases.set(mint, now + leaseMs);

  let released = false;
  return async () => {
    if (released) return;
    released = true;
    const t = await nowMs();
    db.prepare(
      `
      CREATE TABLE IF NOT EXISTS mint_activity (mint TEXT PRIMARY KEY, last_action_ts INTEGER NOT NULL);
    `,
    ).run();
    db.prepare(
      `
      INSERT INTO mint_activity (mint, last_action_ts)
      VALUES (?, ?)
      ON CONFLICT(mint) DO UPDATE SET last_action_ts=excluded.last_action_ts
    `,
    ).run(mint, t);
    leases.delete(mint);
  };
}
