import 'server-only';
import { Connection, PublicKey } from '@solana/web3.js';

const CACHE = new Map<string, { at: number; migrated: boolean }>();

export async function isMigrated(mint: string, rpcUrl?: string): Promise<boolean> {
  const key = mint;
  const now = Date.now();
  const cached = CACHE.get(key);
  if (cached && now - cached.at < 30_000) return cached.migrated;
  try {
    const conn = new Connection(
      rpcUrl || process.env.HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com',
      'processed',
    );
    // Heuristic: pool presence indicates migration; a thorough approach would inspect on-chain events
    const programAccounts = await conn
      .getProgramAccounts(new PublicKey('Jetswap1111111111111111111111111111111111111'), {
        filters: [{ memcmp: { offset: 0, bytes: new PublicKey(mint).toBase58() } }],
        commitment: 'processed',
      })
      .catch(() => []);
    const migrated = (programAccounts?.length || 0) > 0;
    CACHE.set(key, { at: now, migrated });
    return migrated;
  } catch {
    CACHE.set(key, { at: now, migrated: false });
    return false;
  }
}
