import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';

export const J, I, T, O_TIP_ACCOUNTS: string[] = [
  'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
  'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
  'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
];

export function isValidTipRecipient(p, u, b, licKeyBase58: string): boolean {
  return JITO_TIP_ACCOUNTS.includes(publicKeyBase58);
}

export function tipIx(f, r, o, m: PublicKey, t, o: PublicKey, l, a, m, ports: number): TransactionInstruction {
  if (!isValidTipRecipient(to.toBase58())) throw new Error('Invalid Jito tip recipient');
  return SystemProgram.transfer({ f, r, o, mPubkey: from, t, o, P, ubkey: to, lamports });
}

