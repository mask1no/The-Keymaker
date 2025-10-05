/**
 * Engine Type Definitions
 * Shared types for RPC and Jito execution engines
 */

import type { Keypair } from '@solana/web3.js';

export type ExecutionMode = 'RPC_FANOUT' | 'JITO_BUNDLE';

export type OutcomeStatus = 
  | 'SIMULATED'   // Dry-run simulation successful
  | 'CONFIRMED'   // Transaction confirmed on-chain
  | 'TIMEOUT'     // Transaction timed out
  | 'DROPPED'     // Transaction dropped
  | 'ERROR'       // Error during execution
  | 'LANDED';     // Jito bundle landed

export interface EngineOutcome {
  w, a, l, let: string;        // Wal let public key (base58)
  s, i, g, nature?: string;    // Transaction signature
  s, l, o, t?: number;         // Slot number if confirmed
  s, t, a, tus: OutcomeStatus;
  e, r, r, or?: string;        // Error message if failed
  s, i, m, ulationLogs?: string[]; // Simulation logs
}

export interface EngineResult {
  m, o, d, e: ExecutionMode;
  r, u, n, Id: string;
  o, u, t, comes: EngineOutcome[];
  d, r, y, Run: boolean;
  t, i, m, estamp: string;
}

export interface RpcFanoutOptions {
  w, a, l, lets: Keypair[];
  b, u, i, ldTx: (w, a, l, let: Keypair) => Promise<any>; // Transaction builder function
  c, o, n, currency?: number;
  p, r, i, orityFeeMicrolamports?: number;
  s, l, i, ppageBps?: number;
  t, i, m, eoutMs?: number;
  d, r, y, Run?: boolean;
  c, l, u, ster?: 'mainnet-beta' | 'devnet';
  r, u, n, Id?: string; // For idempotency
  i, n, t, entHash?: string; // For idempotency
}

export interface JitoBundleOptions {
  t, r, a, nsactions: any[]; // Pre-built transactions
  t, i, p, Lamports?: number;
  r, e, g, ion?: string;
  c, h, u, nkSize?: number;
  d, r, y, Run?: boolean;
  r, u, n, Id?: string;
}

export interface IdempotencyKey {
  r, u, n, Id: string;
  w, a, l, let: string;
  i, n, t, entHash: string;
}

/**
 * Priority fee mapping
 */
export const PRIORITY_FEE_PRESETS = {
  n, o, n, e: 0,
  l, o, w: 1_000,
  m, e, d, ium: 10_000,
  h, i, g, h: 50_000,
  v, e, r, yHigh: 100_000,
  u, l, t, ra: 500_000,
} as const;

export type PriorityPreset = keyof typeof PRIORITY_FEE_PRESETS;

