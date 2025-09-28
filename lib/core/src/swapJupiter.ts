import { AddressLookupTableAccount, Connection, PublicKey, TransactionInstruction, TransactionMessage, VersionedTransaction } from '@solana/web3.js';

type Quote = {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  slippageBps: number;
  swapMode: 'ExactIn' | 'ExactOut';
  priceImpactPct: number;
  routePlan: unknown[];
};

const JUP = 'https://quote-api.jup.ag/v6';
export const WSOL = 'So11111111111111111111111111111111111111112';

async function httpJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

export async function getQuote(params: {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps: number;
}): Promise<Quote> {
  const qs = new URLSearchParams({
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    amount: String(params.amount),
    slippageBps: String(params.slippageBps),
    swapMode: 'ExactIn',
    asLegacyTransaction: 'false',
  });
  return httpJson<Quote>(`${JUP}/quote?${qs.toString()}`);
}

export async function getSwapIxs(args: {
  route: Quote;
  userPublicKey: PublicKey;
  wrapAndUnwrapSol?: boolean;
}): Promise<{
  computeBudgetInstructions: TransactionInstruction[];
  setupInstructions: TransactionInstruction[];
  swapInstruction: TransactionInstruction;
  cleanupInstruction?: TransactionInstruction;
  addressLookupTableAddresses: string[];
}> {
  const body = {
    quoteResponse: args.route,
    userPublicKey: args.userPublicKey.toBase58(),
    wrapAndUnwrapSol: args.wrapAndUnwrapSol ?? true,
    dynamicComputeUnitLimit: true,
    asLegacyTransaction: false,
  };
  return httpJson(`${JUP}/swap-instructions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function buildSwapTx(params: {
  connection: Connection;
  signerPub: PublicKey;
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps: number;
  priorityMicrolamports?: number;
}): Promise<VersionedTransaction> {
  const quote = await getQuote({
    inputMint: params.inputMint || WSOL,
    outputMint: params.outputMint,
    amount: params.amount,
    slippageBps: params.slippageBps,
  });
  const ixs = await getSwapIxs({ route: quote, userPublicKey: params.signerPub });
  const cuIxs: TransactionInstruction[] = [];
  if (typeof params.priorityMicrolamports === 'number' && params.priorityMicrolamports > 0) {
    const { ComputeBudgetProgram } = await import('@solana/web3.js');
    cuIxs.push(
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: params.priorityMicrolamports }),
    );
  }
  const altKeys = ixs.addressLookupTableAddresses.map((a) => new PublicKey(a));
  const alts: AddressLookupTableAccount[] = [];
  if (altKeys.length) {
    const res = await params.connection.getAddressLookupTable(altKeys[0]);
    if (res.value) alts.push(res.value);
  }
  const { blockhash } = await params.connection.getLatestBlockhash('finalized');
  const msg = new TransactionMessage({
    payerKey: params.signerPub,
    recentBlockhash: blockhash,
    instructions: [
      ...cuIxs,
      ...ixs.computeBudgetInstructions,
      ...ixs.setupInstructions,
      ixs.swapInstruction,
      ...(ixs.cleanupInstruction ? [ixs.cleanupInstruction] : []),
    ],
  }).compileToV0Message(alts);
  return new VersionedTransaction(msg);
}


