import 'server-only';
import { Connection, PublicKey } from '@solana/web3.js';
import { logger } from '@/lib/logger';

const RAYDIUM_PROGRAM_ID = new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8');

/**
 * Check if a pump.fun token has migrated to Raydium
 */
export async function isMigrated(
  mint: string | PublicKey,
  connection: Connection,
): Promise<boolean> {
  try {
    const mintPubkey = typeof mint === 'string' ? new PublicKey(mint) : mint;

    // Check for Raydium pool accounts
    const accounts = await connection.getProgramAccounts(RAYDIUM_PROGRAM_ID, {
      filters: [
        {
          memcmp: {
            offset: 400, // Token mint offset in pool state
            bytes: mintPubkey.toBase58(),
          },
        },
      ],
    });

    const migrated = accounts.length > 0;

    logger.info('Checked migration status', {
      mint: mintPubkey.toBase58(),
      migrated,
      poolsFound: accounts.length,
    });

    return migrated;
  } catch (error) {
    logger.error('Failed to check migration status', { error, mint });
    // Return false on error to default to curve trading
    return false;
  }
}

/**
 * Get pool address for a migrated token
 */
export async function getPoolAddress(
  mint: string | PublicKey,
  connection: Connection,
): Promise<PublicKey | null> {
  try {
    const mintPubkey = typeof mint === 'string' ? new PublicKey(mint) : mint;

    const accounts = await connection.getProgramAccounts(RAYDIUM_PROGRAM_ID, {
      filters: [
        {
          memcmp: {
            offset: 400,
            bytes: mintPubkey.toBase58(),
          },
        },
      ],
    });

    if (accounts.length === 0) {
      return null;
    }

    return accounts[0].pubkey;
  } catch (error) {
    logger.error('Failed to get pool address', { error, mint });
    return null;
  }
}
