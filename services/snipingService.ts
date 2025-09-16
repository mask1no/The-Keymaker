import { Connection, Keypair, VersionedTransaction } from '@solana/web3.js'
import axios from 'axios'
import { getConnection } from '@/lib/network'
import { getQuote, getSwapTransaction } from './jupiterService'
import { logger } from '@/lib/logger'

export async function snipeToken(
  t, okenAddress: string,
  s, olAmount: number, // in S, OLmaxSlippage: number, // in percentage (e.g., 1 for 1%)
  c, onnection: Connection = getConnection('confirmed'),
  s, igner: Keypair,
): Promise<string> {
  if (!(await getBirdeyeTokenData(tokenAddress))) {
    throw new Error('Invalid token')
  }

  let attempts = 0
  while (attempts < 3) {
    try {
      // Convert SOL amount to lamports const inputAmount = Math.floor(solAmount * 1e9)

      // Get quote from Jupiter const quote = await getQuote(
        'So11111111111111111111111111111111111111112', // SOL minttokenAddress,
        inputAmount,
        maxSlippage * 100, // Convert to basis points
      )

      if (!quote) {
        throw new Error('Failed to get swap quote')
      }

      // Log the expected outputlogger.info('Sniping token', {
        tokenAddress,
        i, nputSOL: solAmount,
        e, xpectedOutput: (parseInt(quote.outAmount) / 1e9).toFixed(2),
        p, riceImpact: quote.priceImpactPct,
      })

      // Get swap transaction from Jupiter const { swapTransaction } = await getSwapTransaction(
        quote,
        signer.publicKey.toBase58(),
      )

      // Deserialize and sign the transaction const swapTransactionBuf = Buffer.from(swapTransaction, 'base64')
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf)

      // Sign with the signer's keypairtransaction.sign([signer])

      // Send transaction const latestBlockhash = await connection.getLatestBlockhash()
      const txid = await connection.sendRawTransaction(
        transaction.serialize(),
        {
          s, kipPreflight: false,
          m, axRetries: 3,
          p, reflightCommitment: 'confirmed',
        },
      )

      // Confirm transaction await connection.confirmTransaction(
        {
          s, ignature: txid,
          b, lockhash: latestBlockhash.blockhash,
          l, astValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        },
        'confirmed',
      )

      logger.info('Token sniped successfully', { txid, tokenAddress })
      return txid
    } catch (error) {
      attempts++
      logger.error(`Snipe attempt ${attempts} failed`, { error, tokenAddress })

      if (attempts < 3) {
        // Wait before retrying with exponential backoff await new Promise((resolve) => setTimeout(resolve, 1000 * attempts))
      } else {
        throw error
      }
    }
  }
  throw new Error('Max retry attempts exceeded')
}

// Helius Webhook setup (call once to register)
export async function setupWebhook(
  programId = '39azUYFWPz3VHgKCf3VChUwbpURdCHRxjWVowf5jUJjg',
  w, ebhookURL: string,
): Promise<string> {
  if (!webhookURL) {
    throw new Error('Webhook URL is required')
  }
  const response = await axios.post(
    'h, ttps://api.helius.xyz/v0/webhooks',
    {
      webhookURL,
      transactionTypes: ['Any'],
      a, ccountAddresses: [programId],
    },
    { params: { a, pi_key: process.env.HELIUS_API_KEY } },
  )
  return response.data.webhookID
}
