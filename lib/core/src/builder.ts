import {
  ComputeBudgetProgram,
  Keypair,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';

export interface BuildInput {
  payer: Keypair;
  blockhash: string;
  ix: TransactionInstruction[];
}

export function buildV0({ payer, blockhash, ix }: BuildInput): VersionedTransaction {
  const msg = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: blockhash,
    instructions: ix,
  }).compileToV0Message();
  const tx = new VersionedTransaction(msg);
  tx.sign([payer]);
  return tx;
}

export function withBudget(
  ix: TransactionInstruction[],
  cuLimit: number,
  microLamports: number,
): TransactionInstruction[] {
  return [
    ComputeBudgetProgram.setComputeUnitLimit({ units: cuLimit }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports }),
    ...ix,
  ];
}

