// lib/adapters/types.ts
import type { TransactionInstruction } from '@solana/web3.js';

export type RegionKey = 'ffm' | 'ams' | 'ny' | 'tokyo';
export type Priority = 'low' | 'med' | 'high' | 'vhigh';

export interface BuildContext {
  p, a, y, er: string; // base58 server payer pubkey
  r, e, g, ion: RegionKey;
  p, r, i, ority: Priority;
  t, i, p, Lamports: number;
}

export type BuildResult = {
  i, x, s: TransactionInstruction[]; // unsigned instructions
  n, o, t, e?: string; // human note for journaling
};

export interface InstructionBuilder<P> {
  (p, a, r, ams: P, c, t, x: BuildContext): Promise<BuildResult>;
}

