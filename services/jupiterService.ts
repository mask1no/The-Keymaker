import { VersionedTransaction } from '@solana/web3.js'
import axios from 'axios'
import { NEXT_PUBLIC_JUPITER_API_URL } from '../constants'
import { QuoteResponse, SwapResponse } from '@/lib/types'

const WSOL_MINT = 'So11111111111111111111111111111111111111112'

export async function getQuote(
  inputMint: string,
  outputMint: string,
  amount: number, // in lamports/smallest unit
  slippageBps = 50, // 0.5% default
  swapMode = 'ExactIn',
): Promise<QuoteResponse> {
  try {
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: amount.toString(),
      slippageBps: slippageBps.toString(),
      swapMode,
      onlyDirectRoutes: 'false',
      asLegacyTransaction: 'false',
    })

    const response = await axios.get(
      `${NEXT_PUBLIC_JUPITER_API_URL}/quote?${params}`,
      {
        headers: {
          Accept: 'application/json',
        },
        timeout: 10000,
      },
    )

    return response.data
  } catch (error) {
    const err = error as {
      response?: { data?: { error?: string } }
      message?: string
    }
    console.error('Jupiter quote error:', err.response?.data || err.message)
    throw new Error(
      `Failed to get quote: ${err.response?.data?.error || err.message}`,
    )
  }
}

export async function getSwapTransaction(
  quote: QuoteResponse,
  userPublicKey: string,
  wrapAndUnwrapSol = true,
  feeAccount?: string,
  prioritizationFeeLamports?: number,
  feeBps?: number,
): Promise<SwapResponse> {
  try {
    const body: any = {
      quoteResponse: quote,
      userPublicKey,
      wrapAndUnwrapSol,
      asLegacyTransaction: false,
      computeUnitPriceMicroLamports: 'auto',
      dynamicComputeUnitLimit: true,
    }

    if (feeAccount) {
      body.feeAccount = feeAccount
    }

    if (prioritizationFeeLamports) {
      body.prioritizationFeeLamports = prioritizationFeeLamports
    }

    if (feeBps && feeBps > 0) {
      body.feeBps = feeBps
    }

    const response = await axios.post(
      `${NEXT_PUBLIC_JUPITER_API_URL}/swap`,
      body,
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      },
    )

    return response.data
  } catch (error: any) {
    console.error('Jupiter swap error:', error.response?.data || error.message)
    throw new Error(
      `Failed to get swap transaction: ${error.response?.data?.error || error.message}`,
    )
  }
}

export async function buildSwapTransaction(
  inputMint: string,
  outputMint: string,
  amountLamports: number,
  userPublicKey: string,
  slippageBps = 50,
  priorityFee?: number,
  feeBps?: number,
): Promise<VersionedTransaction> {
  // Get quote
  const quote = await getQuote(
    inputMint,
    outputMint,
    amountLamports,
    slippageBps,
  )

  // Get swap transaction
  const swap = await getSwapTransaction(
    quote,
    userPublicKey,
    true,
    undefined,
    priorityFee,
    feeBps,
  )

  // Deserialize the transaction
  const swapTransactionBuf = Buffer.from(swap.swapTransaction, 'base64')
  const transaction = VersionedTransaction.deserialize(swapTransactionBuf)

  return transaction
}

export async function getTokenPrice(
  tokenMint: string,
  vsToken = 'USDC',
): Promise<number> {
  try {
    const response = await axios.get(
      `${NEXT_PUBLIC_JUPITER_API_URL}/price?ids=${tokenMint}&vsToken=${vsToken}`,
      {
        headers: {
          Accept: 'application/json',
        },
        timeout: 5000,
      },
    )

    const data = response.data.data
    if (data && data[tokenMint]) {
      return data[tokenMint].price
    }

    throw new Error('Price not found')
  } catch (error) {
    console.error('Failed to get token price:', error)
    throw error
  }
}

export async function calculatePriceImpact(
  quote: QuoteResponse,
): Promise<number> {
  return parseFloat(quote.priceImpactPct)
}

export function convertToLamports(amount: number, decimals = 9): number {
  return Math.floor(amount * Math.pow(10, decimals))
}

export function convertFromLamports(lamports: number, decimals = 9): number {
  return lamports / Math.pow(10, decimals)
}

export { WSOL_MINT }
