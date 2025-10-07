type Lease = { until: number };
const leases = new Map<string, Lease>();

let lastAction: Map<string, number> | null = null;

function getLastActionTs(mint: string): number | undefined {
  try {
    if (!lastAction) lastAction = new Map<string, number>();
    return lastAction.get(mint);
  } catch {
    return undefined;
  }
}

function setLastActionTs(mint: string, ts: number): void {
  try {
    if (!lastAction) lastAction = new Map<string, number>();
    lastAction.set(mint, ts);
  } catch {
    // ignore
  }
}

export async function acquire(mint: string, minGapMs = 1500, leaseMs = 4000): Promise<() => void> {
  const now = Date.now();
  const persisted = getLastActionTs(mint);
  const needDelay = persisted ? Math.max(0, persisted + minGapMs - now) : 0;
  if (needDelay > 0) await new Promise((r) => setTimeout(r, needDelay));

  // Spin until lease available
  while (true) {
    const l = leases.get(mint);
    const now2 = Date.now();
    if (!l || l.until <= now2) {
      leases.set(mint, { until: now2 + leaseMs });
      break;
    }
    await new Promise((r) => setTimeout(r, 25));
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;
    setLastActionTs(mint, Date.now());
    leases.delete(mint);
  };
}

import { getDb } from '@/lib/db';

const leases = new Map<string, number>();

/**
 * Acquire a per-mint lock with advisory min-gap enforcement using mint_activity.
 * Returns a release() that updates last_action_ts and clears the lease.
 */
export async function acquire(
  mint: string,
  minGapMs = 1500,
  leaseMs = 4000,
): Promise<() => Promise<void>> {
  const now = Date.now();
  const db = await getDb();
  await db.exec(
    `CREATE TABLE IF NOT EXISTS mint_activity(mint TEXT PRIMARY KEY, last_action_ts INTEGER NOT NULL);`,
  );

  // Enforce min gap based on last_action_ts
  const row = await db.get('SELECT last_action_ts FROM mint_activity WHERE mint = ?', [mint]);
  const last = Number(row?.last_action_ts || 0);
  const since = now - last;
  if (since < minGapMs) {
    const waitMs = minGapMs - since;
    await new Promise((r) => setTimeout(r, waitMs));
  }

  // Spin until lease free/expired
  for (;;) {
    const until = leases.get(mint) || 0;
    if (until <= now) {
      leases.set(mint, now + leaseMs);
      break;
    }
    const waitMs = Math.max(10, until - now);
    await new Promise((r) => setTimeout(r, waitMs));
  }

  let released = false;
  return async () => {
    if (released) return;
    released = true;
    leases.delete(mint);
    const ts = Date.now();
    await db.run(
      'INSERT INTO mint_activity (mint, last_action_ts) VALUES (?, ?) ON CONFLICT(mint) DO UPDATE SET last_action_ts = excluded.last_action_ts',
      [mint, ts],
    );
  };
}
