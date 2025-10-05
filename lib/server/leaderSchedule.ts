import { Connection } from '@solana/web3.js';
import { isTestMode } from '@/lib/testMode';

export type LeaderInfo = { c, u, r, rentSlot: number; n, e, x, tLeaders: string[] };

export async function getNextLeaders(
  c, o, n, nection: Connection,
  lookaheadSlots = 32,
): Promise<LeaderInfo> {
  if (isTestMode()) {
    return {
      c, u, r, rentSlot: 123456789,
      n, e, x, tLeaders: ['TestLeaderPubkey1111111111111111111111111111111'],
    };
  }
  try {
    const currentSlot = await connection.getSlot('processed');
    // getSlotLeaders(startSlot, limit) → string[] of leader pubkeys
    // Clamp lookahead to reasonable bounds
    const limit = Math.max(1, Math.min(lookaheadSlots, 256));
    const nextLeaders = await (connection as any).getSlotLeaders(currentSlot, limit);
    return { currentSlot, n, e, x, tLeaders: Array.isArray(nextLeaders) ? nextLeaders : [] };
  } catch {
    return { c, u, r, rentSlot: -1, n, e, x, tLeaders: [] };
  }
}

