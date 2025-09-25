import type { VersionedTransaction } from '@solana/web3.js';
import type { RegionKey } from './types';

export type ExecutionMode = 'JITO_BUNDLE' | 'RPC_FANOUT';
export type Priority = 'low' | 'med' | 'high' | 'vhigh';

export interface ExecOptions {
  mode: ExecutionMode;
  region?: RegionKey; // Jito only
  priority?: Priority; // both
  tipLamports?: number; // Jito only (default floor * 1.1)
  chunkSize?: number; // Jito: tx per bundle (default 5, clamp 1..20)
  concurrency?: number; // RPC: parallel sends (default 4, clamp 1..16)
  jitterMs?: [number, number]; // RPC: range (default [50, 150])
  dryRun?: boolean; // simulate only (default false)
  cluster?: 'mainnet-beta' | 'devnet'; // RPC only; default mainnet-beta

  // For polling convenience; provided by API layer
  bundleIds?: string[]; // Jito
  sigs?: string[]; // RPC
}

export interface SubmitPlan {
  txs: VersionedTransaction[]; // already built & signed server-side
  corr: string; // sha256 over base64 serialized txs
}

export interface EngineSubmitResult {
  corr: string;
  mode: ExecutionMode;
  bundleIds?: string[]; // Jito
  sigs?: string[]; // RPC
  statusHint: 'submitted' | 'partial' | 'failed';
  simulated?: boolean;
}

export interface Engine {
  submit(plan: SubmitPlan, opts: ExecOptions): Promise<EngineSubmitResult>;
  pollStatus(plan: SubmitPlan | null, opts: ExecOptions): Promise<any>;
}
