// @ts-nocheck
import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js'
export const JITO_TIP_ACCOUNTS = [
  'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
  'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
  'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
]
export function isValidTipRecipient(pk: string){ return JITO_TIP_ACCOUNTS.includes(pk) }
export function tipIx(from: PublicKey, to: PublicKey, lamports: number): TransactionInstruction {
  if (!isValidTipRecipient(to.toBase58())) throw new Error('Invalid Jito tip recipient')
  return SystemProgram.transfer({ fromPubkey: from, toPubkey: to, lamports })
}

