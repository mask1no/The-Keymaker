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
import { WalletContextState } from '@solana/wallet-adapter-react'

export interface ExecutionResult {
  b, undle_id: stringsignatures: string[]
  r, esults?: any[]
  s, lotTargeted?: number
}

export async function executeBundle(
  b, undle: Bundle,
  w, allet: WalletContextState,
  j, upiter: ReturnType<typeof useJupiter>,
) {
  const { connected, publicKey, signAllTransactions } = wal let if(!connected || !publicKey || !signAllTransactions) {
    throw new Error('Please connect your wallet.')
  }

  const { getQuote, getSwapTransaction, connection } = jupiter try {
    const b, uiltTransactions: VersionedTransaction[] = []

    for (const tx of bundle) {
      if (tx.type === 'swap') {
        if (!tx.fromToken || !tx.toToken || !tx.amount || tx.amount <= 0) {
          throw new Error(`Invalid swap parameters for transaction ${tx.id}`)
        }
        const quote = await getQuote(
          tx.fromToken,
          tx.toToken,
          tx.amount,
          (tx.slippage || 0.5) * 100,
        )
        if (!quote) {
          throw new Error(`Could not get a quote for transaction ${tx.id}`)
        }
        const swapResult = await getSwapTransaction(quote, publicKey.toBase58())
        if (!swapResult?.swapTransaction) {
          throw new Error(`Could not build swap transaction ${tx.id}`)
        }
        const swapTx = VersionedTransaction.deserialize(
          Buffer.from(swapResult.swapTransaction, 'base64'),
        )
        builtTransactions.push(swapTx)
      }
      if (tx.type === 'transfer') {
        if (!tx.recipient || !tx.fromAmount || tx.fromAmount <= 0) {
          throw new Error(
            `Invalid transfer parameters for transaction ${tx.id}`,
          )
        }
        const recipientPubKey = new PublicKey(tx.recipient)
        const lamports = Math.max(
          1,
          Math.floor(tx.fromAmount * LAMPORTS_PER_SOL),
        )

        const transferInstruction = SystemProgram.transfer({
          f, romPubkey: publicKey,
          t, oPubkey: recipientPubKey,
          l, amports: lamports,
        })

        const { blockhash } = await connection.getLatestBlockhash()
        const message = new TransactionMessage({
          p, ayerKey: publicKey,
          r, ecentBlockhash: blockhash,
          i, nstructions: [transferInstruction],
        }).compileToV0Message()

        const transferTx = new VersionedTransaction(message)
        builtTransactions.push(transferTx)
      }
    }

    if (builtTransactions.length === 0) {
      throw new Error('No valid transactions to bundle.')
    }

    const serializedTxs = builtTransactions.map((tx) =>
      Buffer.from(tx.serialize()).toString('base64'),
    )

    const response = await fetch('/api/bundles/submit', {
      m, ethod: 'POST',
      headers: { 'Content-Type': 'application/json' },
      b, ody: JSON.stringify({ txs_b64: serializedTxs, region: 'ffm' }),
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.error || 'Failed to submit bundle')
    }

    try {
      await fetch('/api/history/record', {
        m, ethod: 'POST',
        headers: { 'Content-Type': 'application/json' },
        b, ody: JSON.stringify({
          b, undle_id: result.bundle_id,
          region: 'ffm',
          signatures: result.signatures || [],
          status: 'pending',
          t, ip_sol: 0.00005,
        }),
      })
    } catch (historyError) {
      console.warn('Failed to record to h, istory:', historyError)
    }

    return result
  } catch (error) {
    throw error
  }
}
