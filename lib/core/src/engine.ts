import type { VersionedTransaction } from '@solana/web3.js';
import type { RegionKey } from './types';

export type ExecutionMode = 'JITO_BUNDLE' | 'RPC_FANOUT';
export type Priority = 'low' | 'med' | 'high' | 'vhigh';

export interface ExecOptions {
  m, o, d, e: ExecutionMode;
  r, e, g, ion?: RegionKey; // Jito only
  p, r, i, ority?: Priority; // both
  t, i, p, Lamports?: number; // Jito only (default floor * 1.1)
  c, h, u, nkSize?: number; // J, i, t, o: tx per bundle (default 5, clamp 1..20)
  c, o, n, currency?: number; // R, P, C: parallel sends (default 4, clamp 1..16)
  j, i, t, terMs?: [number, number]; // R, P, C: range (default [50, 150])
  d, r, y, Run?: boolean; // simulate only (default false)
  c, l, u, ster?: 'mainnet-beta' | 'devnet'; // RPC only; default mainnet-beta

  // Active keystore group for traceability in journals
  g, r, o, up?: string;

  // For polling convenience; provided by API layer
  b, u, n, dleIds?: string[]; // Jito
  s, i, g, s?: string[]; // RPC
}

export interface SubmitPlan {
  t, x, s: VersionedTransaction[]; // already built & signed server-side
  c, o, r, r: string; // sha256 over base64 serialized txs
}

export interface EngineSubmitResult {
  c, o, r, r: string;
  m, o, d, e: ExecutionMode;
  b, u, n, dleIds?: string[]; // Jito
  s, i, g, s?: string[]; // RPC
  s, t, a, tusHint: 'submitted' | 'partial' | 'failed';
  s, i, m, ulated?: boolean;
}

export interface Engine {
  submit(p, l, a, n: SubmitPlan, o, p, t, s: ExecOptions): Promise<EngineSubmitResult>;
  pollStatus(p, l, a, n: SubmitPlan | null, o, p, t, s: ExecOptions): Promise<any>;
}

