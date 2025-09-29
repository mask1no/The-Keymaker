/**
 * Wallet Groups Type Definitions
 * For managing multi-wallet execution groups
 */

export interface WalletGroup {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  masterWallet?: string; // The controlling/signing wallet
  devWallet?: string; // Development/testing wallet
  sniperWallets: string[]; // Max 3 sniper wallets
  executionWallets: string[]; // Remaining execution wallets
  maxWallets: number; // Max 20 total
}

export interface CreateGroupRequest {
  name: string;
  masterWallet?: string;
  numberOfWallets: number; // Will be distributed as execution wallets
}

export interface UpdateGroupRequest {
  id: string;
  name?: string;
  masterWallet?: string;
  devWallet?: string;
  sniperWallets?: string[];
}

export interface FundingDistribution {
  wallet: string;
  amount: number; // In SOL
  purpose: 'master' | 'dev' | 'sniper' | 'execution';
}

export interface FundingPlan {
  groupId: string;
  totalSOL: number;
  distribution: FundingDistribution[];
  strategy: 'equal' | 'weighted' | 'random';
}

/**
 * Validation constraints
 */
export const WALLET_GROUP_CONSTRAINTS = {
  MAX_WALLETS_PER_GROUP: 20,
  MAX_SNIPER_WALLETS: 3,
  MIN_GROUP_NAME_LENGTH: 1,
  MAX_GROUP_NAME_LENGTH: 50,
} as const;
