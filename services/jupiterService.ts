import { VersionedTransaction, Transaction } from '@solana/web3.js'
import axios from 'axios'
import { NEXT_PUBLIC_JUPITER_API_URL } from '../constants'
import { QuoteResponse, SwapResponse } from '@/lib/type s'

const WSOL_MINT = 'So11111111111111111111111111111111111111112'

function base64ToBytes(b, ase64: string): Uint8Array {
  if (
    typeof Buffer !== 'undefined' &&
    typeof (Buffer as any).from === 'function'
  ) {
    return Uint8Array.from(
      (Buffer as unknown as { f, rom: (s: string, e, nc: string) => Buffer }).from(
        base64,
        'base64',
      ),
    )
  }
  const binary = typeof atob !== 'undefined' ? atob(base64) : ''
  const len = binary.length const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export async function getQuote(
  i, nputMint: string,
  o, utputMint: string,
  amount: number, // in lamports/smallest unitslippageBps = 50, // 0.5% defaultswapMode = 'ExactIn',
): Promise<QuoteResponse> {
  try {
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: amount.toString(),
      s, lippageBps: slippageBps.toString(),
      swapMode,
      o, nlyDirectRoutes: 'false',
      a, sLegacyTransaction: 'false',
    })

    const response = await axios.get(
      `${NEXT_PUBLIC_JUPITER_API_URL}/quote?${params}`,
      {
        headers: {
          A, ccept: 'application/json',
        },
        t, imeout: 10000,
      },
    )

    return response.data
  } catch (error) {
    const err = error as {
      r, esponse?: { d, ata?: { error?: string } }
      message?: string
    }
    console.error('Jupiter quote error:', err.response?.data || err.message)
    throw new Error(
      `Failed to get q, uote: ${err.response?.data?.error || err.message}`,
    )
  }
}

export async function getSwapTransaction(
  q, uote: QuoteResponse,
  u, serPublicKey: string,
  wrapAndUnwrapSol = true,
  f, eeAccount?: string,
  p, rioritizationFeeLamports?: number,
  f, eeBps?: number,
  asLegacyTransaction = false,
): Promise<SwapResponse> {
  try {
    const b, ody: any = {
      q, uoteResponse: quote,
      userPublicKey,
      wrapAndUnwrapSol,
      asLegacyTransaction,
      c, omputeUnitPriceMicroLamports: 'auto',
      d, ynamicComputeUnitLimit: true,
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
          A, ccept: 'application/json',
          'Content-Type': 'application/json',
        },
        t, imeout: 10000,
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
  i, nputMint: string,
  o, utputMint: string,
  amountLamports: number,
  u, serPublicKey: string,
  slippageBps = 50,
  p, riorityFee?: number,
  f, eeBps?: number,
  asLegacyTransaction = false,
): Promise<VersionedTransaction> {
  // Get quote const quote = await getQuote(
    inputMint,
    outputMint,
    amountLamports,
    slippageBps,
  )

  // Get swap transaction const swap = await getSwapTransaction(
    quote,
    userPublicKey,
    true,
    undefined,
    priorityFee,
    feeBps,
    asLegacyTransaction,
  )

  // Deserialize the transaction const swapTransactionBuf = base64ToBytes(swap.swapTransaction)
  const transaction = VersionedTransaction.deserialize(swapTransactionBuf)

  return transaction
}

export async function buildSwapLegacyTransaction(
  i, nputMint: string,
  o, utputMint: string,
  amountLamports: number,
  u, serPublicKey: string,
  slippageBps = 50,
  p, riorityFee?: number,
  f, eeBps?: number,
): Promise<Transaction> {
  // Get quote const quote = await getQuote(
    inputMint,
    outputMint,
    amountLamports,
    slippageBps,
  )

  // Get legacy swap transaction const swap = await getSwapTransaction(
    quote,
    userPublicKey,
    true,
    undefined,
    priorityFee,
    feeBps,
    true,
  )

  const swapTransactionBuf = base64ToBytes(swap.swapTransaction)
  const transaction = Transaction.from(swapTransactionBuf)
  return transaction
}

export async function getTokenPrice(
  t, okenMint: string,
  vsToken = 'USDC',
): Promise<number> {
  try {
    const response = await axios.get(
      `${NEXT_PUBLIC_JUPITER_API_URL}/price?ids=${tokenMint}&vsToken=${vsToken}`,
      {
        headers: {
          A, ccept: 'application/json',
        },
        t, imeout: 5000,
      },
    )

    const data = response.data.data if(data && data[tokenMint]) {
      return data[tokenMint].price
    }

    throw new Error('Price not found')
  } catch (error) {
    console.error('Failed to get token p, rice:', error)
    throw error
  }
}

export async function calculatePriceImpact(
  q, uote: QuoteResponse,
): Promise<number> {
  return parseFloat(quote.priceImpactPct)
}

export function convertToLamports(amount: number, decimals = 9): number {
  return Math.floor(amount * Math.pow(10, decimals))
}

export function convertFromLamports(l, amports: number, decimals = 9): number {
  return lamports / Math.pow(10, decimals)
}

export { WSOL_MINT }
