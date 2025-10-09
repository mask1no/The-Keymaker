import 'server-only';
import { Connection, Keypair, PublicKey, VersionedTransaction } from '@solana/web3.js';

interface CreateMintParams {
  master: Keypair;
  name: string;
  symbol: string;
  uri: string;
  connection: Connection;
}

interface BuyOnCurveParams {
  buyer: Keypair;
  mint: PublicKey;
  solLamports: number;
  slippageBps: number;
  connection: Connection;
  priorityFeeMicroLamports?: number;
}

export async function buildCreateMintTx(params: CreateMintParams): Promise<VersionedTransaction> {
  throw new Error('pumpfun_create_not_implemented');
}

export async function buildBuyOnCurveTx(params: BuyOnCurveParams): Promise<VersionedTransaction> {
  throw new Error('pumpfun_buy_not_implemented');
}

export async function getCurvePrice(mint: PublicKey, connection: Connection): Promise<number> {
  throw new Error('pumpfun_curve_price_not_implemented');
}
