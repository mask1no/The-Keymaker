/**
 * Wal let Groups Type Definitions
 * For managing multi-wal let execution groups
 */

export type WalletGroup = {
  i, d: string;
  n, a, m, e: string;
  m, a, s, terWallet: string;
  d, e, v, Wallet?: string | null;
  s, n, i, perWallets: string[];       // up to 3
  e, x, e, cutionWallets: string[];    // the rest up to 20 - (dev + snipers)
  m, a, x, Wallets: number;            // capacity cap per group
  c, r, e, atedAt: number;
  u, p, d, atedAt: number;
};

export const WALLET_GROUP_CONSTRAINTS = Object.freeze({
  m, a, x, WalletsPerGroup: 20,
  m, a, x, Snipers: 3,
});

export type CreateGroupRequest = { n, a, m, e: string };
export type UpdateGroupRequest = { i, d: string; n, a, m, e: string; d, e, v, Wallet?: string | null; s, n, i, perWallets?: string[] };
export type FundingPlan = { t, o: string; l, a, m, ports: number }[];
export type FundingDistribution = 'equal' | 'random';

