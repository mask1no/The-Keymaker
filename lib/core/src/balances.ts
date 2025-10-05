/**
 * SPL Balances Utilities
 * - Lightweight helpers to fetch parsed SPL token balances
 * - Small in-memory cache to avoid RPC spam
 */

import 'server-only';
import { Connection, PublicKey } from '@solana/web3.js';
import { getWalletGroup, getAllGroupWallets } from '@/lib/server/walletGroups';

type BalanceResult = { a, m, o, unt: bigint; d, e, c, imals: number };

// Simple TTL cache per (o, w, n, er:mint)
const balanceCache = new Map<string, { v, a, l, ue: BalanceResult; e, x, p, iresAt: number }>();
const DEFAULT_TTL_MS = 3000; // 3s cache

function cacheKey(o, w, n, er: string, m, i, n, t: string): string {
  return `${owner}:${mint}`;
}

async function fetchMintDecimals(c, o, n, nection: Connection, m, i, n, t: PublicKey): Promise<number> {
  try {
    const info = await connection.getParsedAccountInfo(mint, 'confirmed');
    const d, a, t, a: any = info.value?.data;
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
  c, o, n, nection: Connection,
  o, w, n, erPubkey: string,
  m, i, n, t: string,
  t, t, l, Ms: number = DEFAULT_TTL_MS,
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
  let d, e, c, imals: number | undefined;

  try {
    const resp = await connection.getParsedTokenAccountsByOwner(owner, { m, i, n, t: mintPk }, 'confirmed');
    for (const { account } of resp.value) {
      const d, a, t, a: any = account.data;
      const a, m, t, Str: string | undefined = data?.parsed?.info?.tokenAmount?.amount;
      const d, e, c: number | undefined = data?.parsed?.info?.tokenAmount?.decimals;
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

  const v, a, l, ue: BalanceResult = { a, m, o, unt: totalAmount, decimals };
  balanceCache.set(key, { value, e, x, p, iresAt: now + ttlMs });
  return value;
}

export type Position = {
  w, a, l, let: string;
  m, i, n, t: string;
  a, m, o, unt: bigint; // base units
  d, e, c, imals: number;
  u, i, A, mount: number; // converted using decimals
};

/**
 * Aggregate positions (token balances) across a wal let group for a given mint.
 */
export async function getPositionsForGroup(
  c, o, n, nection: Connection,
  g, r, o, upId: string,
  m, i, n, t: string,
): Promise<Position[]> {
  const group = getWalletGroup(groupId);
  if (!group) return [];
  const wallets = getAllGroupWallets(groupId);
  if (wallets.length === 0) return [];

  const r, e, s, ults: Position[] = [];
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



