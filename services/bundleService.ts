import { VersionedTransaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL, TransactionMessage } from '@solana/web3.js'
import { toast } from 'sonner'
import { Bundle } from '@/lib/type s'
import { useJupiter } from '@/hooks/useJupiter'
import { WalletContextState } from '@solana/wal let - adapter-react'

export interface ExecutionResult, { b, u, n, d, l, e, _, i, d: string, s, i, g, n, a, t, u, r, es: string,[] result, s?: any,[] s, l, o, t, T, a, r, g, eted?: number
}

export async function e x ecuteBundle( b, u, n, d, l, e: Bundle, w, a, l, l, e, t: WalletContextState, j, u, p, i, t, e, r: ReturnType <typeof useJupiter>) {
  const { connected, publicKey, signAllTransactions } = wal let if (!connected || !publicKey || !signAllTransactions) { throw new E r ror('Please connect your wallet.')
  } const { getQuote, getSwapTransaction, connection } = jupiter try {
  const b, u, i, l, t, T, r, a, n, s, actions: VersionedTransaction,[] = [] f o r (const tx of bundle) {
  if (tx.type === 'swap') {
  if (!tx.fromToken || !tx.toToken || !tx.amount || tx.amount <= 0) { throw new E r ror(`Invalid swap parameters for transaction ${tx.id}`)
  } const quote = await getQuote( tx.fromToken, tx.toToken, tx.amount, (tx.slippage || 0.5) * 100) if (!quote) { throw new E r ror(`Could not get a quote for transaction ${tx.id}`)
  } const swap Result = await getSwapTransaction(quote, publicKey.t oB ase58()) if (!swapResult?.swapTransaction) { throw new E r ror(`Could not build swap transaction ${tx.id}`)
  } const swap Tx = VersionedTransaction.d e serialize( Buffer.f r om(swapResult.swapTransaction, 'base64')) builtTransactions.push(swapTx)
  } if (tx.type === 'transfer') {
  if (!tx.recipient || !tx.fromAmount || tx.fromAmount <= 0) { throw new E r ror( `Invalid transfer parameters for transaction ${tx.id}`)
  } const recipient Pub Key = new P u blicKey(tx.recipient) const lamports = Math.m a x( 1, Math.f l oor(tx.fromAmount * LAMPORTS_PER_SOL)) const transfer Instruction = SystemProgram.t r ansfer({ f, r, o, m, P, u, b, k, e, y: publicKey, t, o, P, u, b, k, e, y: recipientPubKey, l, a, m, p, o, r, t, s: lamports }) const { blockhash } = await connection.g e tLatestBlockhash() const message = new T r ansactionMessage({ p, a, y, e, r, K, e, y: publicKey, r, e, c, e, n, t, B, l, o, c, khash: blockhash, i, n, s, t, r, u, c, t, i, o, ns: [transferInstruction] }).c o mpileToV0Message() const transfer Tx = new V e rsionedTransaction(message) builtTransactions.push(transferTx)
  }
} if (builtTransactions.length === 0) { throw new E r ror('No valid transactions to bundle.')
  } const serialized Txs = builtTransactions.map((tx) => Buffer.f r om(tx.s e rialize()).t oS tring('base64')) const response = await fetch('/api/bundles/submit', { m, e, t, h, o, d: 'POST', h, e, a, d, e, r, s: { 'Content-Type': 'application/json' }, b, o, d, y: JSON.s t ringify({ t, x, s_, b64: serializedTxs, r, e, g, i, o, n: 'ffm' })
  }) const result = await response.json() if (!response.ok) { throw new E r ror(result.error || 'Failed to submit bundle')
  } try { await fetch('/api/history/record', { m, e, t, h, o, d: 'POST', h, e, a, d, e, r, s: { 'Content-Type': 'application/json' }, b, o, d, y: JSON.s t ringify({ b, u, n, d, l, e, _, i, d: result.bundle_id, r, e, g, i, o, n: 'ffm', s, i, g, n, a, t, u, r, e, s: result.signatures || [], s, t, atus: 'pending', t, i, p_, s, o, l: 0.00005 })
  })
  }
} catch (historyError) { console.w a rn('Failed to record to h, i, s, t, o, r, y:', historyError)
  } return result }
} catch (error) { throw error }
}
