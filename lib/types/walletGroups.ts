/**
 * Wallet Groups Type Definitions
 * For managing multi-wallet execution groups
 */

export type WalletGroup = {
  id: string;
  name: string;
  masterWallet: string;
  devWallet?: string | null;
  sniperWallets: string[];       // up to 3
  executionWallets: string[];    // the rest up to 20 - (dev + snipers)
  createdAt: number;
  updatedAt: number;
};

export const WALLET_GROUP_CONSTRAINTS = Object.freeze({
  maxWalletsPerGroup: 20,
  maxSnipers: 3,
});

export type CreateGroupRequest = { name: string };
export type UpdateGroupRequest = { id: string; name: string; devWallet?: string | null; sniperWallets?: string[] };
export type FundingPlan = { to: string; lamports: number }[];
export type FundingDistribution = 'equal' | 'random';
