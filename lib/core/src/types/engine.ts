/**
 * Engine Type Definitions
 * Shared types for RPC and Jito execution engines
 */

import type { Keypair } from '@solana/web3.js';

export type ExecutionMode = 'RPC_FANOUT';

export type OutcomeStatus =
  | 'SIMULATED' // Dry-run simulation successful
  | 'CONFIRMED' // Transaction confirmed on-chain
  | 'TIMEOUT' // Transaction timed out
  | 'DROPPED' // Transaction dropped
  | 'ERROR' // Error during execution
  | 'LANDED'; // Jito bundle landed

export interface EngineOutcome {
  wallet: string; // Wallet public key (base58)
  signature?: string; // Transaction signature
  slot?: number; // Slot number if confirmed
  status: OutcomeStatus;
  error?: string; // Error message if failed
  simulationLogs?: string[]; // Simulation logs
}

export interface EngineResult {
  mode: ExecutionMode;
  runId: string;
  outcomes: EngineOutcome[];
  dryRun: boolean;
  timestamp: string;
}

export interface RpcFanoutOptions {
  wallets: Keypair[];
  buildTx: (wallet: Keypair) => Promise<any>; // Transaction builder function
  concurrency?: number;
  priorityFeeMicrolamports?: number;
  slippageBps?: number;
  timeoutMs?: number;
  dryRun?: boolean;
  cluster?: 'mainnet-beta' | 'devnet';
  runId?: string; // For idempotency
  intentHash?: string; // For idempotency
}

export interface JitoBundleOptions {
  transactions: any[]; // Pre-built transactions
  tipLamports?: number;
  region?: string;
  chunkSize?: number;
  dryRun?: boolean;
  runId?: string;
}

export interface IdempotencyKey {
  runId: string;
  wallet: string;
  intentHash: string;
}

/**
 * Priority fee mapping
 */
export const PRIORITY_FEE_PRESETS = {
  none: 0,
  low: 1_000,
  medium: 10_000,
  high: 50_000,
  veryHigh: 100_000,
  ultra: 500_000,
} as const;

export type PriorityPreset = keyof typeof PRIORITY_FEE_PRESETS;
