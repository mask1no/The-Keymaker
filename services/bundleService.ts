import {
  VersionedTransaction,
  SystemProgram,
  PublicKey,
  LAMPORTS_PER_SOL,
  TransactionMessage,
} from '@solana/web3.js'
import { toast } from 'sonner'
import { Bundle } from '@/lib/types'
import { useJupiter } from '@/hooks/useJupiter'
import { WalletContextState } from '@solana/wallet-adapter-react'

export interface ExecutionResult {
  bundle_id: string
  signatures: string[]
  results?: any[]
  slotTargeted?: number
}

export async function executeBundle(
  bundle: Bundle,
  wallet: WalletContextState,
  jupiter: ReturnType<typeof useJupiter>,
) {
  const { connected, publicKey, signAllTransactions } = wallet
  if (!connected || !publicKey || !signAllTransactions) {
    throw new Error('Please connect your wallet.')
  }

  const { getQuote, getSwapTransaction, connection } = jupiter
  try {
    const builtTransactions: VersionedTransaction[] = []

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
          fromPubkey: publicKey,
          toPubkey: recipientPubKey,
          lamports: lamports,
        })

        const { blockhash } = await connection.getLatestBlockhash()
        const message = new TransactionMessage({
          payerKey: publicKey,
          recentBlockhash: blockhash,
          instructions: [transferInstruction],
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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txs_b64: serializedTxs, region: 'ffm' }),
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.error || 'Failed to submit bundle')
    }

    try {
      await fetch('/api/history/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bundle_id: result.bundle_id,
          region: 'ffm',
          signatures: result.signatures || [],
          status: 'pending',
          tip_sol: 0.00005,
        }),
      })
    } catch (historyError) {
      console.warn('Failed to record to history:', historyError)
    }

    return result
  } catch (error) {
    throw error
  }
}
