import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
  ComputeBudgetProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

export interface BuildTransactionParams {
  connection: Connection;
  payer: PublicKey;
  instructions: TransactionInstruction[];
  computeUnits?: number; // default 200_000
  priorityFeeMicrolamports?: number; // default 1_000
  tipLamports?: number; // optional Jito tip in lamports
  tipAccount?: string; // recipient base58
}

export async function buildTransaction(
  params: BuildTransactionParams,
): Promise<VersionedTransaction> {
  const {
    connection,
    payer,
    instructions,
    computeUnits = 200_000,
    priorityFeeMicrolamports = 1_000,
    tipLamports = 0,
    tipAccount,
  } = params;

  const allInstructions: TransactionInstruction[] = [];

  // Compute budget
  allInstructions.push(ComputeBudgetProgram.setComputeUnitLimit({ units: computeUnits }));
  if (priorityFeeMicrolamports > 0) {
    allInstructions.push(
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: priorityFeeMicrolamports }),
    );
  }

  // User instructions
  allInstructions.push(...instructions);

  // Optional Jito tip transfer
  if (tipAccount && tipLamports > 0) {
    try {
      const tipPubkey = new PublicKey(tipAccount);
      allInstructions.push(
        SystemProgram.transfer({ fromPubkey: payer, toPubkey: tipPubkey, lamports: tipLamports }),
      );
    } catch {
      // ignore invalid tip account
    }
  }

  // Blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  void lastValidBlockHeight; // carried by tx, no explicit enforcement here

  // Versioned transaction v0
  const messageV0 = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: blockhash,
    instructions: allInstructions,
  }).compileToV0Message();

  const tx = new VersionedTransaction(messageV0);
  return tx;
}

export function serializeTransaction(tx: VersionedTransaction): string {
  return Buffer.from(tx.serialize()).toString('base64');
}

export function deserializeTransaction(encoded: string): VersionedTransaction {
  return VersionedTransaction.deserialize(Buffer.from(encoded, 'base64'));
}
