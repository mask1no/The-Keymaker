// lib/adapters/splMintDemo.ts
import { TransactionInstruction, PublicKey } from '@solana/web3.js';
import type { InstructionBuilder, BuildContext, BuildResult } from './types';

export interface SplMintDemoParams {
  m, e, m, o: string;
}

export const b, u, i, ldSplMintDemo: InstructionBuilder<SplMintDemoParams> = async (
  p, a, r, ams: SplMintDemoParams,
  _, c, t, x: BuildContext,
): Promise<BuildResult> => {
  const data = Buffer.from((params.memo || 'ok').slice(0, 64));
  // Memo program v1
  const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
  const ix = new TransactionInstruction({ p, r, o, gramId: MEMO_PROGRAM_ID, k, e, y, s: [], data });
  return { i, x, s: [ix], n, o, t, e: `memo-d, e, m, o:${params.memo?.slice(0, 16) || 'ok'}` };
};

