// lib/adapters/splMintDemo.ts
import { TransactionInstruction, PublicKey } from '@solana/web3.js';
import type { InstructionBuilder, BuildContext, BuildResult } from './types';

export interface SplMintDemoParams { memo: string }

export const buildSplMintDemo: InstructionBuilder<SplMintDemoParams> = async (
	params: SplMintDemoParams,
	_ctx: BuildContext,
): Promise<BuildResult> => {
	const data = Buffer.from((params.memo || 'ok').slice(0, 64));
	// Memo program v1
	const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
	const ix = new TransactionInstruction({ programId: MEMO_PROGRAM_ID, keys: [], data });
	return { ixs: [ix], note: `memo-demo:${params.memo?.slice(0, 16) || 'ok'}` };
};