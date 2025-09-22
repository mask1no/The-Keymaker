import { Connection } from '@solana/web3.js';
import { isTestMode } from '@/lib/testMode';

export type LeaderInfo = { currentSlot: number; nextLeaders: string[] };

export async function getNextLeaders(
  connection: Connection,
  lookaheadSlots = 32,
): Promise<LeaderInfo> {
  if (isTestMode()) {
    return {
      currentSlot: 123456789,
      nextLeaders: ['TestLeaderPubkey1111111111111111111111111111111'],
    };
  }
  try {
    const currentSlot = await connection.getSlot('processed');
    // getSlotLeaders(startSlot, limit) → string[] of leader pubkeys
    // Clamp lookahead to reasonable bounds
    const limit = Math.max(1, Math.min(lookaheadSlots, 256));
    const nextLeaders = await (connection as any).getSlotLeaders(currentSlot, limit);
    return { currentSlot, nextLeaders: Array.isArray(nextLeaders) ? nextLeaders : [] };
  } catch {
    return { currentSlot: -1, nextLeaders: [] };
  }
}
