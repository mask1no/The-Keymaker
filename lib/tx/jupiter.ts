import { VersionedTransaction, Keypair } from '@solana/web3.js';
import { buildJupiterSwapTx, buildJupiterSellTx } from '@/lib/core/src/jupiterAdapter';

export async function buildSwapTx(params: {
  wallet: Keypair;
  inputMint: string;
  outputMint: string;
  amountLamports: number;
  slippageBps: number;
  priorityFeeMicrolamports?: number;
}): Promise<VersionedTransaction> {
  // Convert lamports→SOL for adapter
  const amountSol = params.amountLamports / 1e9;
  return buildJupiterSwapTx({
    wallet: params.wallet,
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    amountSol,
    slippageBps: params.slippageBps,
    priorityFeeMicrolamports: params.priorityFeeMicrolamports,
  });
}

export async function buildSellTx(params: {
  wallet: Keypair;
  inputMint: string; // token mint
  outputMint: string; // SOL
  amountTokens: number; // base units
  slippageBps: number;
  priorityFeeMicrolamports?: number;
}): Promise<VersionedTransaction> {
  return buildJupiterSellTx({
    wallet: params.wallet,
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    amountTokens: params.amountTokens,
    slippageBps: params.slippageBps,
    priorityFeeMicrolamports: params.priorityFeeMicrolamports,
  });
}
