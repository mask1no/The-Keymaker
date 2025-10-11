/**
 * SPL Balances Utilities
 * - Lightweight helpers to fetch parsed SPL token balances
 * - Small in-memory cache to avoid RPC spam
 */

import 'server-only';
import { Connection, PublicKey } from '@solana/web3.js';
import { getWalletGroup, getAllGroupWallets } from '@/lib/server/walletGroups';

type BalanceResult = { amount: bigint; decimals: number };

// Simple TTL cache per (owner:mint)
const balanceCache = new Map<string, { value: BalanceResult; expiresAt: number }>();
const DEFAULT_TTL_MS = 3000; // 3s cache

function cacheKey(owner: string, mint: string): string {
  return `${owner}:${mint}`;
}

async function fetchMintDecimals(connection: Connection, mint: PublicKey): Promise<number> {
  try {
    const info = await connection.getParsedAccountInfo(mint, 'confirmed');
    const data: any = info.value?.data;
    const parsed = data?.parsed;
    const decimals = parsed?.info?.decimals;
    if (typeof decimals === 'number') return decimals;
  } catch {}
  // Fallback to the common default for many SPL tokens
  return 9;
}

/**
 * Get SPL token balance for an owner and mint using parsed accounts.
 * Amount is returned in base units (raw integer) with decimals.
 */
export async function getSplTokenBalance(
  connection: Connection,
  ownerPubkey: string,
  mint: string,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<BalanceResult> {
  const key = cacheKey(ownerPubkey, mint);
  const now = Date.now();
  const cached = balanceCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const owner = new PublicKey(ownerPubkey);
  const mintPk = new PublicKey(mint);

  let totalAmount = 0n;
  let decimals: number | undefined;

  try {
    const resp = await connection.getParsedTokenAccountsByOwner(
      owner,
      { mint: mintPk },
      'confirmed',
    );
    for (const { account } of resp.value) {
      const data: any = account.data;
      const amtStr: string | undefined = data?.parsed?.info?.tokenAmount?.amount;
      const dec: number | undefined = data?.parsed?.info?.tokenAmount?.decimals;
      if (amtStr) {
        try {
          totalAmount += BigInt(amtStr);
        } catch {}
      }
      if (typeof dec === 'number') decimals = dec;
    }
  } catch {
    // If the RPC call fails, fall back to zero with default decimals
  }

  if (decimals === undefined) {
    decimals = await fetchMintDecimals(connection, mintPk);
  }

  const value: BalanceResult = { amount: totalAmount, decimals };
  balanceCache.set(key, { value, expiresAt: now + ttlMs });
  return value;
}

export type Position = {
  wallet: string;
  mint: string;
  amount: bigint; // base units
  decimals: number;
  uiAmount: number; // converted using decimals
};

/**
 * Aggregate positions (token balances) across a wallet group for a given mint.
 */
export async function getPositionsForGroup(
  connection: Connection,
  groupId: string,
  mint: string,
): Promise<Position[]> {
  const group = getWalletGroup(groupId);
  if (!group) return [];
  const wallets = getAllGroupWallets(groupId);
  if (wallets.length === 0) return [];

  const results: Position[] = [];
  await Promise.all(
    wallets.map(async (wallet) => {
      try {
        const { amount, decimals } = await getSplTokenBalance(connection, wallet, mint);
        if (amount === 0n) return;
        const uiAmount = Number(amount) / Math.pow(10, decimals);
        results.push({ wallet, mint, amount, decimals, uiAmount });
      } catch {}
    }),
  );
  return results;
}
