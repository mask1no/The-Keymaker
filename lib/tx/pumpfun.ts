import { Keypair, VersionedTransaction } from '@solana/web3.js';
import { buildSwapTx } from '@/lib/tx/jupiter';
import { isMigrated } from '@/lib/pump/migration';

export async function buildCreateMintTx(_params: {
  devPubkey: string;
  name: string;
  symbol: string;
  supply: number;
  decimals?: number;
}): Promise<VersionedTransaction> {
  // Placeholder: Pump.fun create via canonical program is not yet implemented
  // Avoid returning a mock transaction; callers should handle this error clearly
  throw new Error('pumpfun_create_not_implemented');
}

export async function buildBuyTx(params: {
  buyer: Keypair;
  mint: string;
  solLamports: number;
  slippageBps: number;
  priorityFeeMicrolamports?: number;
}): Promise<VersionedTransaction> {
  // If migrated → Jupiter SOL→mint swap (V6)
  if (await isMigrated(params.mint)) {
    return buildSwapTx({
      wallet: params.buyer,
      inputMint: 'So11111111111111111111111111111111111111112',
      outputMint: params.mint,
      amountLamports: params.solLamports,
      slippageBps: params.slippageBps,
      priorityFeeMicrolamports: params.priorityFeeMicrolamports,
    });
  }
  // Else: still on bonding curve → pump.fun buy path (to be implemented)
  throw new Error('pumpfun_buy_not_implemented');
}
