import { Connection, Keypair, PublicKey, VersionedTransaction } from '@solana/web3.js'
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token'
import axios from 'axios'
import * as Sentry from '@sentry/nextjs'
import { NEXT_PUBLIC_JUPITER_API_URL } from '../constants'
import { logger } from '@/lib/logger'
// import { logSellEvent } from './executionLogService' // Dynamic import below

export interface SellConditions {
  // PnL conditions
  minPnlPercent?: number // Minimum profit percentage before selling
  maxLossPercent?: number // Maximum loss percentage (stop loss)

  // Market cap conditions
  targetMarketCap?: number // Target market cap in USD
  minMarketCap?: number // Minimum market cap before selling

  // Time conditions
  minHoldTime?: number // Minimum time to hold in seconds
  maxHoldTime?: number // Maximum time to hold in seconds

  // Price conditions
  targetPrice?: number // Target token price in USD
  stopLossPrice?: number // Stop loss price in USD

  // Volume conditions
  minVolume24h?: number // Minimum 24h volume in USD

  // Manual trigger
  manualSell?: boolean // Force sell regardless of conditions
}

export interface SellParams {
  wallet: Keypair
  tokenMint: PublicKey
  amount: number // Amount of tokens to sell
  slippage?: number // Slippage tolerance (default 1%)
  conditions: SellConditions
  priority?: 'low' | 'medium' | 'high' | 'veryHigh'
}

export interface SellResult {
  success: boolean
  txSignature?: string
  inputAmount: number
  outputAmount: number // SOL received
  priceImpact: number
  pnlPercent?: number
  executionPrice: number
  error?: string
}

export interface TokenPriceInfo {
  price: number
  marketCap: number
  volume24h: number
  priceChange24h: number
}

function base64ToBytes(base64: string): Uint8Array {
  if (typeof Buffer !== 'undefined' && typeof (Buffer as any).from === 'function') {
    return Uint8Array.from((Buffer as unknown as { from: (s: string, enc: string) => Buffer }).from(base64, 'base64'))
  }
  const binary = typeof atob !== 'undefined' ? atob(base64) : ''
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/**
 * Get token price information from Jupiter
 */
export async function getTokenPrice(
  tokenMint: string,
): Promise<TokenPriceInfo | null> {
  try {
    const response = await axios.get(
      `${NEXT_PUBLIC_JUPITER_API_URL}/price?ids=${tokenMint}`,
      {
        headers: {
          ...(process.env.JUPITER_API_KEY
            ? { 'X-API-KEY': process.env.JUPITER_API_KEY }
            : {}),
        },
      },
    )

    const data = response.data?.data?.[tokenMint]
    if (!data) return null

    return {
      price: data.price || 0,
      marketCap: data.marketCap || 0,
      volume24h: data.volume24h || 0,
      priceChange24h: data.priceChange24h || 0,
    }
  } catch (error) {
    console.error('Failed to get token price:', error)
    return null
  }
}

/**
 * Calculate PnL percentage based on current price vs entry price
 */
export function calculatePnL(
  entryPrice: number,
  currentPrice: number,
  amount: number,
): number {
  if (entryPrice === 0) return 0
  const currentValue = currentPrice * amount
  const entryValue = entryPrice * amount
  return ((currentValue - entryValue) / entryValue) * 100
}

/**
 * Check if sell conditions are met
 */
export async function checkSellConditions(
  tokenMint: string,
  conditions: SellConditions,
  entryPrice?: number,
  entryTime?: number,
): Promise<{ shouldSell: boolean; reason?: string }> {
  // Manual sell overrides all conditions
  if (conditions.manualSell) {
    return { shouldSell: true, reason: 'Manual sell triggered' }
  }

  // Get current token info
  const tokenInfo = await getTokenPrice(tokenMint)
  if (!tokenInfo) {
    return { shouldSell: false, reason: 'Unable to fetch token price' }
  }

  // Check time conditions
  if (entryTime) {
    const holdTime = (Date.now() - entryTime) / 1000 // Convert to seconds

    if (conditions.minHoldTime && holdTime < conditions.minHoldTime) {
      return {
        shouldSell: false,
        reason: `Minimum hold time not met (${holdTime}s < ${conditions.minHoldTime}s)`,
      }
    }

    if (conditions.maxHoldTime && holdTime >= conditions.maxHoldTime) {
      return {
        shouldSell: true,
        reason: `Maximum hold time reached (${holdTime}s)`,
      }
    }
  }

  // Check PnL conditions
  if (entryPrice && (conditions.minPnlPercent || conditions.maxLossPercent)) {
    const pnl = calculatePnL(entryPrice, tokenInfo.price, 1)

    if (conditions.minPnlPercent && pnl >= conditions.minPnlPercent) {
      return {
        shouldSell: true,
        reason: `Target profit reached (${pnl.toFixed(2)}%)`,
      }
    }

    if (conditions.maxLossPercent && pnl <= -conditions.maxLossPercent) {
      return {
        shouldSell: true,
        reason: `Stop loss triggered (${pnl.toFixed(2)}%)`,
      }
    }
  }

  // Check market cap conditions
  if (
    conditions.targetMarketCap &&
    tokenInfo.marketCap >= conditions.targetMarketCap
  ) {
    return {
      shouldSell: true,
      reason: `Target market cap reached ($${tokenInfo.marketCap.toLocaleString()})`,
    }
  }

  if (
    conditions.minMarketCap &&
    tokenInfo.marketCap < conditions.minMarketCap
  ) {
    return {
      shouldSell: false,
      reason: `Minimum market cap not met ($${tokenInfo.marketCap.toLocaleString()})`,
    }
  }

  // Check price conditions
  if (conditions.targetPrice && tokenInfo.price >= conditions.targetPrice) {
    return {
      shouldSell: true,
      reason: `Target price reached ($${tokenInfo.price})`,
    }
  }

  if (conditions.stopLossPrice && tokenInfo.price <= conditions.stopLossPrice) {
    return {
      shouldSell: true,
      reason: `Stop loss price triggered ($${tokenInfo.price})`,
    }
  }

  // Check volume conditions
  if (
    conditions.minVolume24h &&
    tokenInfo.volume24h < conditions.minVolume24h
  ) {
    return {
      shouldSell: false,
      reason: `Minimum 24h volume not met ($${tokenInfo.volume24h.toLocaleString()})`,
    }
  }

  return { shouldSell: false, reason: 'No sell conditions met' }
}

/**
 * Calculate dynamic slippage based on liquidity and amount
 */
async function calculateDynamicSlippage(
  inputMint: string,
  outputMint: string,
  amount: number,
): Promise<number> {
  try {
    // Get initial quote to assess liquidity
    const testResponse = await axios.get(
      `${NEXT_PUBLIC_JUPITER_API_URL}/quote`,
      {
        params: {
          inputMint,
          outputMint,
          amount: Math.floor(amount).toString(),
          slippageBps: 100, // 1% for test
          onlyDirectRoutes: false,
          asLegacyTransaction: false,
        },
        headers: {
          ...(process.env.JUPITER_API_KEY
            ? { 'X-API-KEY': process.env.JUPITER_API_KEY }
            : {}),
        },
      },
    )

    const quote = testResponse.data
    const priceImpact = parseFloat(quote.priceImpactPct) || 0

    // Calculate slippage based on price impact
    let slippageBps: number

    if (priceImpact < 0.1) {
      // Very liquid, low impact
      slippageBps = 50 // 0.5%
    } else if (priceImpact < 0.5) {
      // Good liquidity
      slippageBps = 100 // 1%
    } else if (priceImpact < 1) {
      // Moderate liquidity
      slippageBps = 200 // 2%
    } else if (priceImpact < 3) {
      // Low liquidity
      slippageBps = 300 // 3%
    } else if (priceImpact < 5) {
      // Very low liquidity
      slippageBps = 500 // 5%
    } else {
      // Extremely low liquidity
      slippageBps = Math.min(1000, Math.ceil(priceImpact * 100 + 200)) // Up to 10%
    }

    // Add extra buffer for volatile tokens
    if (priceImpact > 1) {
      slippageBps = Math.min(5000, slippageBps * 1.5) // Max 50%
    }

    logger.info(
      `Dynamic slippage for ${amount} tokens: ${slippageBps} bps (price impact: ${priceImpact}%)`,
    )
    return slippageBps
  } catch (error) {
    logger.error('Error calculating dynamic slippage:', { error: error.message })
    // Fallback to conservative default
    return 300 // 3% default
  }
}

/**
 * Get Jupiter swap quote
 */
async function getSwapQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippage?: number, // Optional, will calculate dynamically if not provided
) {
  try {
    // Calculate dynamic slippage if not provided
    const slippageBps =
      slippage ??
      (await calculateDynamicSlippage(inputMint, outputMint, amount))

    const response = await axios.get(`${NEXT_PUBLIC_JUPITER_API_URL}/quote`, {
      params: {
        inputMint,
        outputMint,
        amount: Math.floor(amount).toString(),
        slippageBps,
        onlyDirectRoutes: false,
        asLegacyTransaction: false,
      },
      headers: {
        ...(process.env.JUPITER_API_KEY
          ? { 'X-API-KEY': process.env.JUPITER_API_KEY }
          : {}),
      },
    })

    return response.data
  } catch (error) {
    console.error('Failed to get swap quote:', error)
    throw error
  }
}

/**
 * Execute swap transaction via Jupiter
 */
async function executeSwap(
  connection: Connection,
  wallet: Keypair,
  quoteResponse: any,
  priorityLevel?: 'low' | 'medium' | 'high' | 'veryHigh',
): Promise<string> {
  try {
    // Get serialized transaction from Jupiter
    const { data } = await axios.post(
      `${NEXT_PUBLIC_JUPITER_API_URL}/swap`,
      {
        quoteResponse,
        userPublicKey: wallet.publicKey.toBase58(),
        wrapAndUnwrapSol: true,
        prioritizationFeeLamports:
          priorityLevel === 'veryHigh'
            ? 1_000_000
            : priorityLevel === 'high'
              ? 500_000
              : priorityLevel === 'medium'
                ? 100_000
                : 10_000,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.JUPITER_API_KEY
            ? { 'X-API-KEY': process.env.JUPITER_API_KEY }
            : {}),
        },
      },
    )

    const { swapTransaction } = data

    // Deserialize and sign transaction
    const transactionBuf = base64ToBytes(swapTransaction)
    const transaction = VersionedTransaction.deserialize(transactionBuf)
    transaction.sign([wallet])

    // Send transaction
    const latestBlockhash = await connection.getLatestBlockhash()
    const rawTransaction = transaction.serialize()
    const txSignature = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: false,
      maxRetries: 2,
    })

    // Confirm transaction
    await connection.confirmTransaction(
      {
        signature: txSignature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      },
      'confirmed',
    )

    return txSignature
  } catch (error) {
    console.error('Swap execution failed:', error)
    throw error
  }
}

/**
 * Execute token sell with conditions
 */
export async function sellToken(
  connection: Connection,
  params: SellParams,
): Promise<SellResult> {
  try {
    // Check if conditions are met
    const conditionCheck = await checkSellConditions(
      params.tokenMint.toBase58(),
      params.conditions,
    )

    if (!conditionCheck.shouldSell && !params.conditions.manualSell) {
      return {
        success: false,
        inputAmount: params.amount,
        outputAmount: 0,
        priceImpact: 0,
        executionPrice: 0,
        error: conditionCheck.reason || 'Sell conditions not met',
      }
    }

    // Get wallet token account
    const tokenAccount = await getAssociatedTokenAddress(
      params.tokenMint,
      params.wallet.publicKey,
    )

    // Get actual token balance
    const account = await getAccount(connection, tokenAccount)
    const actualAmount = Math.min(params.amount, Number(account.amount))

    if (actualAmount === 0) {
      return {
        success: false,
        inputAmount: 0,
        outputAmount: 0,
        priceImpact: 0,
        executionPrice: 0,
        error: 'No tokens to sell',
      }
    }

    // Get swap quote (selling tokens for SOL)
    const quote = await getSwapQuote(
      params.tokenMint.toBase58(),
      'So11111111111111111111111111111111111111112', // SOL mint
      actualAmount,
      (params.slippage || 1) * 100, // Convert to basis points
    )

    if (!quote) {
      return {
        success: false,
        inputAmount: actualAmount,
        outputAmount: 0,
        priceImpact: 0,
        executionPrice: 0,
        error: 'Unable to get swap quote',
      }
    }

    // Execute swap
    const txSignature = await executeSwap(
      connection,
      params.wallet,
      quote,
      params.priority,
    )

    // Calculate results
    const outputAmount = parseInt(quote.outAmount) / 1e9 // Convert lamports to SOL
    const priceImpact = parseFloat(quote.priceImpactPct) || 0
    const executionPrice =
      outputAmount / (actualAmount / Math.pow(10, quote.inputDecimals || 9))

    // Log execution
    try {
      const { logSellEvent } = await import('./executionLogService')
      await logSellEvent({
        wallet: params.wallet.publicKey.toBase58(),
        tokenAddress: params.tokenMint.toBase58(),
        amountSold: actualAmount.toString(),
        solEarned: outputAmount,
        marketCap: 0, // Would need to fetch this
        profitPercentage: 0, // Would need entry price to calculate
        transactionSignature: txSignature,
      })
    } catch (e) {
      // Logging failed, continue without error
      console.warn('Failed to log sell event:', e)
    }

    return {
      success: true,
      txSignature,
      inputAmount: actualAmount,
      outputAmount,
      priceImpact,
      executionPrice,
    }
  } catch (error) {
    Sentry.captureException(error)
    return {
      success: false,
      inputAmount: params.amount,
      outputAmount: 0,
      priceImpact: 0,
      executionPrice: 0,
      error: `Sell failed: ${(error as Error).message}`,
    }
  }
}

/**
 * Batch sell tokens from multiple wallets
 */
export async function batchSellTokens(
  connection: Connection,
  wallets: Keypair[],
  tokenMint: PublicKey,
  conditions: SellConditions,
  slippage?: number,
): Promise<SellResult[]> {
  const results: SellResult[] = []

  // Check conditions once for all wallets
  const conditionCheck = await checkSellConditions(
    tokenMint.toBase58(),
    conditions,
  )

  if (!conditionCheck.shouldSell && !conditions.manualSell) {
    return wallets.map(() => ({
      success: false,
      inputAmount: 0,
      outputAmount: 0,
      priceImpact: 0,
      executionPrice: 0,
      error: conditionCheck.reason || 'Sell conditions not met',
    }))
  }

  // Execute sells in parallel batches to avoid rate limits
  const batchSize = 3
  for (let i = 0; i < wallets.length; i += batchSize) {
    const batch = wallets.slice(i, i + batchSize)
    const batchPromises = batch.map(async (wallet) => {
      try {
        // Get wallet balance
        const tokenAccount = await getAssociatedTokenAddress(
          tokenMint,
          wallet.publicKey,
        )
        const account = await getAccount(connection, tokenAccount)
        const balance = Number(account.amount)

        if (balance === 0) {
          return {
            success: false,
            inputAmount: 0,
            outputAmount: 0,
            priceImpact: 0,
            executionPrice: 0,
            error: 'No balance',
          }
        }

        return sellToken(connection, {
          wallet,
          tokenMint,
          amount: balance,
          slippage,
          conditions,
          priority: 'high', // Use high priority for sniper sells
        })
      } catch (error) {
        return {
          success: false,
          inputAmount: 0,
          outputAmount: 0,
          priceImpact: 0,
          executionPrice: 0,
          error: (error as Error).message,
        }
      }
    })

    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)

    // Small delay between batches to avoid rate limits
    if (i + batchSize < wallets.length) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  return results
}

export default {
  getTokenPrice,
  calculatePnL,
  checkSellConditions,
  sellToken,
  batchSellTokens,
}
