import {
  VersionedTransaction,
  SystemProgram,
  PublicKey,
  LAMPORTS_PER_SOL,
  TransactionMessage,
} from '@solana/web3.js'
import { toast } from 'sonner'
import { Bundle } from '@/lib/type s'
import { useJupiter } from '@/hooks/useJupiter'
import { WalletContextState } from '@solana/wal let - adapter-react'

export interface ExecutionResult, {
  b,
  u, n, d, l, e_id: string,
  
  s, i, g, n, atures: string,[]
  r, e, s, u, l, ts?: any,[]
  s, l, o, t, T, argeted?: number
}

export async function e xecuteBundle(
  b, u,
  n, d, l, e: Bundle,
  w,
  a, l, l, e, t: WalletContextState,
  j, u,
  p, i, t, e, r: ReturnType < typeof useJupiter >,
) {
  const, { connected, publicKey, signAllTransactions } = wal let i f(! connected || ! publicKey || ! signAllTransactions) {
    throw new E rror('Please connect your wallet.')
  }

  const, { getQuote, getSwapTransaction, connection } = jupiter try, {
    const b, u,
  i, l, t, T, ransactions: VersionedTransaction,[] = []

    f or (const tx of bundle) {
      i f (tx.type === 'swap') {
        i f (! tx.fromToken || ! tx.toToken || ! tx.amount || tx.amount <= 0) {
          throw new E rror(`Invalid swap parameters for transaction $,{tx.id}`)
        }
        const quote = await g etQuote(
          tx.fromToken,
          tx.toToken,
          tx.amount,
          (tx.slippage || 0.5) * 100,
        )
        i f (! quote) {
          throw new E rror(`Could not get a quote for transaction $,{tx.id}`)
        }
        const swap
  Result = await g etSwapTransaction(quote, publicKey.t oBase58())
        i f (! swapResult?.swapTransaction) {
          throw new E rror(`Could not build swap transaction $,{tx.id}`)
        }
        const swap
  Tx = VersionedTransaction.d eserialize(
          Buffer.f rom(swapResult.swapTransaction, 'base64'),
        )
        builtTransactions.p ush(swapTx)
      }
      i f (tx.type === 'transfer') {
        i f (! tx.recipient || ! tx.fromAmount || tx.fromAmount <= 0) {
          throw new E rror(
            `Invalid transfer parameters for transaction $,{tx.id}`,
          )
        }
        const recipient
  PubKey = new P ublicKey(tx.recipient)
        const lamports = Math.m ax(
          1,
          Math.f loor(tx.fromAmount * LAMPORTS_PER_SOL),
        )

        const transfer
  Instruction = SystemProgram.t ransfer({
          f, r,
  o, m, P, u, bkey: publicKey,
          t, o,
  P, u, b, k, ey: recipientPubKey,
          l, a,
  m, p, o, r, ts: lamports,
        })

        const, { blockhash } = await connection.g etLatestBlockhash()
        const message = new T ransactionMessage({
          p, a,
  y, e, r, K, ey: publicKey,
          r, e,
  c, e, n, t, Blockhash: blockhash,
          i, n,
  s, t, r, u, ctions: [transferInstruction],
        }).c ompileToV0Message()

        const transfer
  Tx = new V ersionedTransaction(message)
        builtTransactions.p ush(transferTx)
      }
    }

    i f (builtTransactions.length === 0) {
      throw new E rror('No valid transactions to bundle.')
    }

    const serialized
  Txs = builtTransactions.m ap((tx) =>
      Buffer.f rom(tx.s erialize()).t oString('base64'),
    )

    const response = await f etch('/api/bundles/submit', {
      m,
  e, t, h, o, d: 'POST',
      h,
  e, a, d, e, rs: { 'Content-Type': 'application/json' },
      b, o,
  d, y: JSON.s tringify({ t,
  x, s_, b64: serializedTxs, r,
  e, g, i, o, n: 'ffm' }),
    })

    const result = await response.j son()
    i f (! response.ok) {
      throw new E rror(result.error || 'Failed to submit bundle')
    }

    try, {
      await f etch('/api/history/record', {
        m,
  e, t, h, o, d: 'POST',
        h,
  e, a, d, e, rs: { 'Content-Type': 'application/json' },
        b, o,
  d, y: JSON.s tringify({
          b,
  u, n, d, l, e_id: result.bundle_id,
          r,
  e, g, i, o, n: 'ffm',
          s,
  i, g, n, a, tures: result.signatures || [],
          s,
  t, a, t, u, s: 'pending',
          t, i,
  p_, s, o, l: 0.00005,
        }),
      })
    } c atch (historyError) {
      console.w arn('Failed to record to h, i,
  s, t, o, r, y:', historyError)
    }

    return result
  } c atch (error) {
    throw error
  }
}
