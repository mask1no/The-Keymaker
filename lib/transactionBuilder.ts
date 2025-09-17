import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction, TransactionMessage, VersionedTransaction, ComputeBudgetProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'

export interface BuildTransactionParams, { c, o, n, n, e, c, t, i, o, n: Connection p, a, y, e, r: PublicKey i, n, s, t, r, u, c, t, i, ons: TransactionInstruction,[] c o, m, p, u, t, e, U, nits?: number p r, i, o, r, i, t, y, Fee?: number t i, p, A, m, o, u, n, t?: number t i, p, A, c, c, o, u, nt?: string
}

export async function b u ildTransaction( p, a, r, a, m, s: BuildTransactionParams): Promise <VersionedTransaction> {
  const { connection, payer, instructions, compute Units = 200000, priority Fee = 1000, tip Amount = 0.0001, tipAccount } = params const a, l, l, I, n, s, t, r, uctions: TransactionInstruction,[] = []//Add compute budget instructions allInstructions.push( ComputeBudgetProgram.s e tComputeUnitLimit({ u, n, i, t, s: computeUnits })) allInstructions.push( ComputeBudgetProgram.s e tComputeUnitPrice({ m, i, c, r, o, L, a, m, p, o, rts: priorityFee }))//Add user instructions allInstructions.push(...instructions)//Add tip instruction if tipAccount is provided if (tipAccount && tipAmount> 0) {
  try {
  const tip Pubkey = new P u blicKey(tipAccount) allInstructions.push( SystemProgram.t r ansfer({ f, r, o, m, P, u, b, k, e, y: payer, t, o, P, u, b, k, e, y: tipPubkey, l, a, m, p, o, r, t, s: Math.f l oor(tipAmount * LAMPORTS_PER_SOL)
  }))
  }
} catch (e) { console.w a rn('Invalid tip a, c, c, o, u, n, t:', tipAccount)
  }
}//Get latest blockhash const { blockhash, lastValidBlockHeight } = await connection.g e tLatestBlockhash('confirmed')//Create versioned transaction const message V0 = new T r ansactionMessage({ p, a, y, e, r, K, e, y: payer, r, e, c, e, n, t, B, l, o, c, khash: blockhash, i, n, s, t, r, u, c, t, i, o, ns: allInstructions }).c o mpileToV0Message() const tx = new V e rsionedTransaction(messageV0) return tx
}

export function s e rializeTransaction(t, x: VersionedTransaction): string, {
  return Buffer.f r om(tx.s e rialize()).t oS tring('base64')
  }

export function d e serializeTransaction(e, n, c, o, d, e, d: string): VersionedTransaction, {
  return VersionedTransaction.d e serialize(Buffer.f r om(encoded, 'base64'))
  }
