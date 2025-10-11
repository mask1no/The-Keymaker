const leases = new Map<string, number>(); // mint -> leaseUntil
import { getDb } from '@/lib/db';
const now = () => Date.now();

export async function acquireMintLock(
  mint: string,
  wallet: string,
  minGapMs = 1500,
  leaseMs = 4000,
) {
  return acquire(mint, minGapMs, leaseMs);
}

export async function releaseMintLock(mint: string) {
  leases.delete(mint);
}

export async function acquire(mint: string, minGapMs = 1500, leaseMs = 4000) {
  const db = await getDb();
  const last =
    (db.prepare('SELECT last_action_ts FROM mint_activity WHERE mint=?').get(mint) as any)
      ?.last_action_ts ?? 0;
  const gap = now() - last;
  if (gap < minGapMs) await new Promise((r) => setTimeout(r, minGapMs - gap));
  const lease = leases.get(mint) ?? 0;
  if (lease > now()) await new Promise((r) => setTimeout(r, lease - now()));
  leases.set(mint, now() + leaseMs);
  let released = false;
  return async () => {
    if (released) return;
    released = true;
    db.prepare(
      `
      INSERT INTO mint_activity(mint,last_action_ts)
      VALUES(?,?)
      ON CONFLICT(mint) DO UPDATE SET last_action_ts=excluded.last_action_ts
    `,
    ).run(mint, now());
    leases.delete(mint);
  };
}
