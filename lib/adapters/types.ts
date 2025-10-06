// lib/adapters/types.ts
import type { TransactionInstruction } from '@solana/web3.js';

export type RegionKey = 'ffm' | 'ams' | 'ny' | 'tokyo';
export type Priority = 'low' | 'med' | 'high' | 'vhigh';

export interface BuildContext {
  payer: string; // base58 server payer pubkey
  region: RegionKey;
  priority: Priority;
  tipLamports: number;
}

export type BuildResult = {
  ixs: TransactionInstruction[]; // unsigned instructions
  note?: string; // human note for journaling
};

export interface InstructionBuilder<P> {
  (params: P, ctx: BuildContext): Promise<BuildResult>;
}
