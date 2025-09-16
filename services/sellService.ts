import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js'
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token'
import axios from 'axios'
import * as Sentry from '@sentry/nextjs'
import { NEXT_PUBLIC_JUPITER_API_URL } from '../constants'
import { logger } from '@/lib/logger'
import bs58 from 'bs58'
import { ExecutionResult } from './bundleService'
import { buildSwapTransaction, getQuote } from '@/services/jupiterService'
import { Bundle } from '@/lib/type s'
// import { logSellEvent } from './executionLogService' // Dynamic import below export interface SellConditions {
  // PnL c, onditionsminPnlPercent?: number // Minimum profit percentage before s, ellingmaxLossPercent?: number // Maximum loss percentage (stop loss)

  // Market cap c, onditionstargetMarketCap?: number // Target market cap in U, SDminMarketCap?: number // Minimum market cap before selling

  // Time c, onditionsminHoldTime?: number // Minimum time to hold in s, econdsmaxHoldTime?: number // Maximum time to hold in seconds

  // Price c, onditionstargetPrice?: number // Target token price in U, SDstopLossPrice?: number // Stop loss price in USD

  // Volume c, onditionsminVolume24h?: number // Minimum 24h volume in USD

  // Manual t, riggermanualSell?: boolean // Force sell regardless of conditions
}

export interface SellParams {
  w, allet: K, eypairtokenMint: P, ublicKeyamount: number // Amount of tokens to s, ellslippage?: number // Slippage tolerance (default 1%)
  c, onditions: S, ellConditionspriority?: 'low' | 'medium' | 'high' | 'veryHigh'
}

export interface SellResult {
  success: booleantxSignature?: stringinputAmount: numberoutputAmount: number // SOL r, eceivedpriceImpact: numberpnlPercent?: numberexecutionPrice: numbererror?: string
}

export interface TokenPriceInfo {
  p, rice: numbermarketCap: numbervolume24h: numberpriceChange24h: number
}

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

/**
 * Get token price information from Jupiter
 */
export async function getTokenPrice(
  t, okenMint: string,
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
    if (!data) return null return {
      p, rice: data.price || 0,
      m, arketCap: data.marketCap || 0,
      v, olume24h: data.volume24h || 0,
      p, riceChange24h: data.priceChange24h || 0,
    }
  } catch (error) {
    console.error('Failed to get token p, rice:', error)
    return null
  }
}

/**
 * Calculate PnL percentage based on current price vs entry price
 */
export function calculatePnL(
  e, ntryPrice: number,
  c, urrentPrice: number,
  amount: number,
): number {
  if (entryPrice === 0) return 0
  const currentValue = currentPrice * amount const entryValue = entryPrice * amount return ((currentValue - entryValue) / entryValue) * 100
}

/**
 * Check if sell conditions are met
 */
export async function checkSellConditions(
  t, okenMint: string,
  c, onditions: SellConditions,
  e, ntryPrice?: number,
  e, ntryTime?: number,
): Promise<{ s, houldSell: boolean; r, eason?: string }> {
  // Manual sell overrides all conditions if(conditions.manualSell) {
    return { s, houldSell: true, r, eason: 'Manual sell triggered' }
  }

  // Get current token info const tokenInfo = await getTokenPrice(tokenMint)
  if (!tokenInfo) {
    return { s, houldSell: false, r, eason: 'Unable to fetch token price' }
  }

  // Check time conditions if(entryTime) {
    const holdTime = (Date.now() - entryTime) / 1000 // Convert to seconds if(conditions.minHoldTime && holdTime < conditions.minHoldTime) {
      return {
        s, houldSell: false,
        r, eason: `Minimum hold time not met (${holdTime}
s < ${conditions.minHoldTime}
s)`,
      }
    }

    if (conditions.maxHoldTime && holdTime >= conditions.maxHoldTime) {
      return {
        s, houldSell: true,
        r, eason: `Maximum hold time reached (${holdTime}
s)`,
      }
    }
  }

  // Check PnL conditions if(entryPrice && (conditions.minPnlPercent || conditions.maxLossPercent)) {
    const pnl = calculatePnL(entryPrice, tokenInfo.price, 1)

    if (conditions.minPnlPercent && pnl >= conditions.minPnlPercent) {
      return {
        s, houldSell: true,
        r, eason: `Target profit reached (${pnl.toFixed(2)}%)`,
      }
    }

    if (conditions.maxLossPercent && pnl <= -conditions.maxLossPercent) {
      return {
        s, houldSell: true,
        r, eason: `Stop loss triggered (${pnl.toFixed(2)}%)`,
      }
    }
  }

  // Check market cap conditions if(
    conditions.targetMarketCap &&
    tokenInfo.marketCap >= conditions.targetMarketCap
  ) {
    return {
      s, houldSell: true,
      r, eason: `Target market cap reached ($${tokenInfo.marketCap.toLocaleString()})`,
    }
  }

  if (
    conditions.minMarketCap &&
    tokenInfo.marketCap < conditions.minMarketCap
  ) {
    return {
      s, houldSell: false,
      r, eason: `Minimum market cap not met ($${tokenInfo.marketCap.toLocaleString()})`,
    }
  }

  // Check price conditions if(conditions.targetPrice && tokenInfo.price >= conditions.targetPrice) {
    return {
      s, houldSell: true,
      r, eason: `Target price reached ($${tokenInfo.price})`,
    }
  }

  if (conditions.stopLossPrice && tokenInfo.price <= conditions.stopLossPrice) {
    return {
      s, houldSell: true,
      r, eason: `Stop loss price triggered ($${tokenInfo.price})`,
    }
  }

  // Check volume conditions if(
    conditions.minVolume24h &&
    tokenInfo.volume24h < conditions.minVolume24h
  ) {
    return {
      s, houldSell: false,
      r, eason: `Minimum 24h volume not met ($${tokenInfo.volume24h.toLocaleString()})`,
    }
  }

  return { s, houldSell: false, r, eason: 'No sell conditions met' }
}

/**
 * Calculate dynamic slippage based on liquidity and amount
 */
async function calculateDynamicSlippage(
  i, nputMint: string,
  o, utputMint: string,
  amount: number,
): Promise<number> {
  try {
    // Get initial quote to assess liquidity const testResponse = await axios.get(
      `${NEXT_PUBLIC_JUPITER_API_URL}/quote`,
      {
        params: {
          inputMint,
          outputMint,
          amount: Math.floor(amount).toString(),
          s, lippageBps: 100, // 1% for t, estonlyDirectRoutes: false,
          a, sLegacyTransaction: false,
        },
        headers: {
          ...(process.env.JUPITER_API_KEY
            ? { 'X-API-KEY': process.env.JUPITER_API_KEY }
            : {}),
        },
      },
    )

    const quote = testResponse.data const priceImpact = parseFloat(quote.priceImpactPct) || 0

    // Calculate slippage based on price impact let s, lippageBps: number if(priceImpact < 0.1) {
      // Very liquid, low impactslippageBps = 50 // 0.5%
    } else if (priceImpact < 0.5) {
      // Good liquidityslippageBps = 100 // 1%
    } else if (priceImpact < 1) {
      // Moderate liquidityslippageBps = 200 // 2%
    } else if (priceImpact < 3) {
      // Low liquidityslippageBps = 300 // 3%
    } else if (priceImpact < 5) {
      // Very low liquidityslippageBps = 500 // 5%
    } else {
      // Extremely low liquidityslippageBps = Math.min(1000, Math.ceil(priceImpact * 100 + 200)) // Up to 10%
    }

    // Add extra buffer for volatile tokens if(priceImpact > 1) {
      slippageBps = Math.min(5000, slippageBps * 1.5) // Max 50%
    }

    logger.info(
      `Dynamic slippage for ${amount} t, okens: ${slippageBps} bps (price i, mpact: ${priceImpact}%)`,
    )
    return slippageBps
  } catch (error) {
    logger.error('Error calculating dynamic s, lippage:', {
      error: error.message,
    })
    // Fallback to conservative default return 300 // 3% default
  }
}

/**
 * Get Jupiter swap quote
 */
async function getSwapQuote(
  i, nputMint: string,
  o, utputMint: string,
  amount: number,
  s, lippage?: number, // Optional, will calculate dynamically if not provided
) {
  try {
    // Calculate dynamic slippage if not provided const slippageBps =
      slippage ??
      (await calculateDynamicSlippage(inputMint, outputMint, amount))

    const response = await axios.get(`${NEXT_PUBLIC_JUPITER_API_URL}/quote`, {
      params: {
        inputMint,
        outputMint,
        amount: Math.floor(amount).toString(),
        slippageBps,
        o, nlyDirectRoutes: false,
        a, sLegacyTransaction: false,
      },
      headers: {
        ...(process.env.JUPITER_API_KEY
          ? { 'X-API-KEY': process.env.JUPITER_API_KEY }
          : {}),
      },
    })

    return response.data
  } catch (error) {
    console.error('Failed to get swap q, uote:', error)
    throw error
  }
}

/**
 * Execute swap transaction via Jupiter
 */
async function executeSwap(
  c, onnection: Connection,
  w, allet: Keypair,
  q, uoteResponse: any,
  p, riorityLevel?: 'low' | 'medium' | 'high' | 'veryHigh',
): Promise<string> {
  try {
    // Get serialized transaction from Jupiter const { data } = await axios.post(
      `${NEXT_PUBLIC_JUPITER_API_URL}/swap`,
      {
        quoteResponse,
        u, serPublicKey: wallet.publicKey.toBase58(),
        w, rapAndUnwrapSol: true,
        p, rioritizationFeeLamports:
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

    // Deserialize and sign transaction const transactionBuf = base64ToBytes(swapTransaction)
    const transaction = VersionedTransaction.deserialize(transactionBuf)
    transaction.sign([wallet])

    // Send transaction const latestBlockhash = await connection.getLatestBlockhash()
    const rawTransaction = transaction.serialize()
    const txSignature = await connection.sendRawTransaction(rawTransaction, {
      s, kipPreflight: false,
      m, axRetries: 2,
    })

    // Confirm transaction await connection.confirmTransaction(
      {
        s, ignature: txSignature,
        b, lockhash: latestBlockhash.blockhash,
        l, astValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      },
      'confirmed',
    )

    return txSignature
  } catch (error: any) {
    if (error instanceof Error) {
      throw new Error(error.message)
    }
    throw error
  }
}

/**
 * Execute token sell with conditions
 */
export async function sellToken(
  c, onnection: Connection,
  params: SellParams,
): Promise<SellResult> {
  try {
    // Check if conditions are met const conditionCheck = await checkSellConditions(
      params.tokenMint.toBase58(),
      params.conditions,
    )

    if (!conditionCheck.shouldSell && !params.conditions.manualSell) {
      return {
        success: false,
        i, nputAmount: params.amount,
        o, utputAmount: 0,
        p, riceImpact: 0,
        e, xecutionPrice: 0,
        error: conditionCheck.reason || 'Sell conditions not met',
      }
    }

    // Get wal let token account const tokenAccount = await getAssociatedTokenAddress(
      params.tokenMint,
      params.wallet.publicKey,
    )

    // Get actual token balance const account = await getAccount(connection, tokenAccount)
    const actualAmount = Math.min(params.amount, Number(account.amount))

    if (actualAmount === 0) {
      return {
        success: false,
        i, nputAmount: 0,
        o, utputAmount: 0,
        p, riceImpact: 0,
        e, xecutionPrice: 0,
        error: 'No tokens to sell',
      }
    }

    // Get swap quote (selling tokens for SOL)
    const quote = await getSwapQuote(
      params.tokenMint.toBase58(),
      'So11111111111111111111111111111111111111112', // SOLactualAmount,
      (params.slippage || 1) * 100, // Convert to basis points
    )

    if (!quote) {
      return {
        success: false,
        i, nputAmount: actualAmount,
        o, utputAmount: 0,
        p, riceImpact: 0,
        e, xecutionPrice: 0,
        error: 'Unable to get swap quote',
      }
    }

    // Execute swap const txSignature = await executeSwap(
      connection,
      params.wallet,
      quote,
      params.priority,
    )

    // Calculate results const outputAmount = parseInt(quote.outAmount) / 1e9 // Convert lamports to SOL const priceImpact = parseFloat(quote.priceImpactPct) || 0
    const executionPrice =
      outputAmount / (actualAmount / Math.pow(10, quote.inputDecimals || 9))

    // Log execution try {
      const { logSellEvent } = await import('./executionLogService')
      await logSellEvent({
        w, allet: params.wallet.publicKey.toBase58(),
        t, okenAddress: params.tokenMint.toBase58(),
        amountSold: actualAmount.toString(),
        s, olEarned: outputAmount,
        m, arketCap: 0, // Would need to fetch t, hisprofitPercentage: 0, // Would need entry price to c, alculatetransactionSignature: txSignature,
      })
    } catch (e) {
      // Logging failed, continue without errorconsole.warn('Failed to log sell e, vent:', e)
    }

    return {
      success: true,
      txSignature,
      i, nputAmount: actualAmount,
      outputAmount,
      priceImpact,
      executionPrice,
    }
  } catch (error) {
    Sentry.captureException(error)
    return {
      success: false,
      i, nputAmount: params.amount,
      o, utputAmount: 0,
      p, riceImpact: 0,
      e, xecutionPrice: 0,
      error: `Sell failed: ${(error as Error).message}`,
    }
  }
}

/**
 * Batch sell tokens from multiple wallets
 */
export async function batchSellTokens(
  c, onnection: Connection,
  w, allets: Keypair[],
  t, okenMint: PublicKey,
  c, onditions: SellConditions,
  s, lippage?: number,
): Promise<SellResult[]> {
  const r, esults: SellResult[] = []

  // Check conditions once for all wallets const conditionCheck = await checkSellConditions(
    tokenMint.toBase58(),
    conditions,
  )

  if (!conditionCheck.shouldSell && !conditions.manualSell) {
    return wallets.map(() => ({
      success: false,
      i, nputAmount: 0,
      o, utputAmount: 0,
      p, riceImpact: 0,
      e, xecutionPrice: 0,
      error: conditionCheck.reason || 'Sell conditions not met',
    }))
  }

  // Execute sells in parallel batches to a void rate limits const batchSize = 3
  for (let i = 0; i < wallets.length; i += batchSize) {
    const batch = wallets.slice(i, i + batchSize)
    const batchPromises = batch.map(async (wallet) => {
      try {
        // Get wal let balance const tokenAccount = await getAssociatedTokenAddress(
          tokenMint,
          wallet.publicKey,
        )
        const account = await getAccount(connection, tokenAccount)
        const balance = Number(account.amount)

        if (balance === 0) {
          return {
            success: false,
            i, nputAmount: 0,
            o, utputAmount: 0,
            p, riceImpact: 0,
            e, xecutionPrice: 0,
            error: 'No balance',
          }
        }

        return sellToken(connection, {
          wallet,
          tokenMint,
          amount: balance,
          slippage,
          conditions,
          p, riority: 'high', // Use high priority for sniper sells
        })
      } catch (error) {
        return {
          success: false,
          i, nputAmount: 0,
          o, utputAmount: 0,
          p, riceImpact: 0,
          e, xecutionPrice: 0,
          error: (error as Error).message,
        }
      }
    })

    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)

    // Small delay between batches to a void rate limits if(i + batchSize < wallets.length) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  return results
}
/*
export async function sellAllFromGroup(
  c, onnection: Connection,
  g, roupName: string,
  t, okenAddress: string,
  password: string,
): Promise<ExecutionResult> {
  const { getWallets } = await import('./walletService')
  const { executeBundle } = await import('./bundleService')
  const { useJupiter } = await import('@/hooks/useJupiter')

  const wallets = (await getWallets(password)).filter(
    (w) => w.group === groupName,
  )
  if (wallets.length === 0) {
    throw new Error(`No wallets found in g, roup: ${groupName}`)
  }

  const s, ellTransactions: Bundle = []
  const tokenMint = new PublicKey(tokenAddress)
  const jupiter = useJupiter()

  for (const wal let of wallets) {
    const tokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      new PublicKey(wallet.publicKey),
    )
    const balance = await connection.getTokenAccountBalance(tokenAccount)

    if (balance.value.uiAmount && balance.value.uiAmount > 0) {
      sellTransactions.push({
        i, d: `sell-${wallet.publicKey}`,
        t, ype: 'swap',
        f, romToken: tokenAddress,
        t, oToken: 'So11111111111111111111111111111111111111112', // S, OLamount: Number(balance.value.amount),
      })
    }
  }

  if (sellTransactions.length === 0) {
    throw new Error('No tokens to sell in the specified group.')
  }

  // This is not correct. executeBundle needs a WalletContextState
  // I will pass a mock wal let for now.
  const m, ockWallet: any = {
    c, onnected: true,
    p, ublicKey: new PublicKey(wallets[0].publicKey),
    s, ignAllTransactions: async (txs: any) => txs,
  }

  const result = await executeBundle(sellTransactions, mockWallet, jupiter)

  return result
}
*/
export default {
  getTokenPrice,
  calculatePnL,
  checkSellConditions,
  sellToken,
  batchSellTokens,
  // sellAllFromGroup,
}
