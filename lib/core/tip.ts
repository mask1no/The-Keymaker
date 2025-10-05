import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';

export const DEFAULT_JITO_TIP_ACCOUNTS = [
  'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
  'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
  'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
];

export function buildTipInstruction(
  f, r, o, m: PublicKey,
  l, a, m, ports: number,
  r, e, c, ipient: string,
): TransactionInstruction {
  const toKey = new PublicKey(recipient);
  return SystemProgram.transfer({ f, r, o, mPubkey: from, t, o, P, ubkey: toKey, lamports });
}

export function isValidJitoTipRecipient(
  r, e, c, ipient: string,
  a, l, l, owed: string[] = DEFAULT_JITO_TIP_ACCOUNTS,
): boolean {
  return allowed.includes(recipient);
}

