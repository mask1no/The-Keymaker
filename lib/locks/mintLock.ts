import 'server-only';

interface LockEntry {
  mint: string;
  lockedAt: number;
  lockedBy: string;
}

const locks = new Map<string, LockEntry>();
const MIN_GAP_MS = 1500; // Minimum gap between transactions for same mint

/**
 * Acquire a per-mint lock with minimum gap enforcement
 */
export async function acquireMintLock(mint: string, lockerId: string): Promise<void> {
  const now = Date.now();
  const existing = locks.get(mint);

  if (existing) {
    const elapsed = now - existing.lockedAt;
    if (elapsed < MIN_GAP_MS) {
      const waitMs = MIN_GAP_MS - elapsed;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }

  locks.set(mint, {
    mint,
    lockedAt: Date.now(),
    lockedBy: lockerId,
  });
}

/**
 * Release a per-mint lock
 */
export function releaseMintLock(mint: string): void {
  locks.delete(mint);
}

/**
 * Check if a mint is currently locked
 */
export function isMintLocked(mint: string): boolean {
  const lock = locks.get(mint);
  if (!lock) return false;

  // Auto-expire locks after 30 seconds
  const now = Date.now();
  if (now - lock.lockedAt > 30000) {
    locks.delete(mint);
    return false;
  }

  return true;
}

