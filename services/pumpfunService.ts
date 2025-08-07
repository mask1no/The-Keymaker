import axios from 'axios'
import { Keypair } from '@solana/web3.js'
import { NEXT_PUBLIC_PUMP_API_URL } from '../constants'
import { logTokenLaunch } from './executionLogService'
import { retryWithSlippage, DEFAULT_SLIPPAGE_CONFIGS } from './slippageRetry'
import { logger } from '@/lib/logger'
import * as Sentry from '@sentry/nextjs'
import { pumpFunFallback } from './pumpFunFallback'
import { getPuppeteerHelper } from '@/helpers/puppeteerHelper'

type TokenMetadata = {
  name: string
  symbol: string
  description?: string
  image?: string
  telegram?: string
  website?: string
  twitter?: string
}

interface PumpFunResponse {
  success: boolean
  tokenAddress?: string
  signature?: string
  error?: string
  poolAddress?: string
}

export async function createToken(
  name: string,
  symbol: string,
  supply: number,
  metadata: TokenMetadata,
): Promise<string> {
  try {
    const requestData = {
      name: name.slice(0, 32),
      symbol: symbol.slice(0, 10),
      description:
        metadata.description || `${name} - Created with The Keymaker`,
      image: metadata.image || '',
      twitter: metadata.twitter || '',
      telegram: metadata.telegram || '',
      website: metadata.website || '',
      showName: true,
    }

    const response = await axios.post<PumpFunResponse>(
      `${NEXT_PUBLIC_PUMP_API_URL}/create`,
      requestData,
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_PUMPFUN_API_KEY || ''}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 seconds for token creation
      },
    )

    if (!response.data.success || !response.data.tokenAddress) {
      throw new Error(response.data.error || 'Token creation failed')
    }

    // Log token launch
    await logTokenLaunch({
      tokenAddress: response.data.tokenAddress,
      name,
      symbol,
      platform: 'Pump.fun',
      supply: supply.toString(),
      decimals: 9, // Pump.fun uses 9 decimals
      launcherWallet: '', // Would need to be passed in
      transactionSignature: response.data.signature || '',
      liquidityPoolAddress: response.data.poolAddress,
    })

    return response.data.tokenAddress
  } catch (error: any) {
    console.error(
      'Pump.fun token creation error:',
      error.response?.data || error.message,
    )

    // Check if it's a 4xx error and try fallback
    if (error.response?.status >= 400 && error.response?.status < 500) {
      logger.warn(
        'Pump.fun API returned 4xx error, attempting Puppeteer fallback...',
      )

      // First try puppeteer with real browser automation
      try {
        const puppeteerHelper = getPuppeteerHelper()
        const puppeteerResult = await puppeteerHelper.launchTokenOnPumpFun(
          {
            name,
            symbol,
            description: metadata.description || `${name} - Created with The Keymaker`,
            imageUrl: metadata.image || '',
          },
          '' // TODO: Add wallet private key
        )

        // Log token launch with puppeteer result
        await logTokenLaunch({
          tokenAddress: puppeteerResult.mint,
          name,
          symbol,
          platform: 'Pump.fun (Puppeteer)',
          supply: supply.toString(),
          decimals: 9,
          launcherWallet: '',
          transactionSignature: puppeteerResult.txHash,
          liquidityPoolAddress: '',
        })

        return puppeteerResult.mint
      } catch (puppeteerError) {
        logger.warn(
          'Puppeteer fallback failed, trying GUI fallback...',
          puppeteerError,
        )

        // Fall back to the existing GUI fallback
        try {
          const fallbackResult = await pumpFunFallback.launchTokenWithGUI(
            name,
            symbol,
            metadata.description || `${name} - Created with The Keymaker`,
            metadata.image || '',
            { retries: 1 },
          )

          // Log token launch with fallback result
          await logTokenLaunch({
            tokenAddress: fallbackResult.mint,
            name,
            symbol,
            platform: 'Pump.fun (GUI)',
            supply: supply.toString(),
            decimals: 9,
            launcherWallet: '',
            transactionSignature: fallbackResult.txSignature,
            liquidityPoolAddress: fallbackResult.lpAddress,
          })

          return fallbackResult.mint
        } catch (fallbackError) {
          logger.error(
            'Both Puppeteer and GUI fallbacks failed:',
            fallbackError,
          )
          throw new Error(
            `Failed to create token on Pump.fun: ${error.response?.data?.error || error.message} (All fallbacks failed)`,
          )
        }
      }
    }

    throw new Error(
      `Failed to create token on Pump.fun: ${error.response?.data?.error || error.message}`,
    )
  }
}

/**
 * Buy tokens on pump.fun with automatic slippage retry
 */
export async function buyToken(
  tokenMint: string,
  amountSol: number,
  buyer: Keypair,
  maxSlippage = 10,
): Promise<string> {
  const swapFunction = async (slippage: number) => {
    try {
      const response = await axios.post(
        `${NEXT_PUBLIC_PUMP_API_URL}/buy`,
        {
          tokenAddress: tokenMint,
          solAmount: amountSol,
          slippage,
          buyerPublicKey: buyer.publicKey.toBase58(),
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_PUMPFUN_API_KEY || ''}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      )

      if (response.data.success && response.data.signature) {
        return {
          success: true,
          txSignature: response.data.signature,
        }
      }

      return {
        success: false,
        error: response.data.error || 'Buy transaction failed',
      }
    } catch (error: any) {
      logger.error('Pump.fun buy error:', error)
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  }

  // Use retry logic with progressive slippage
  const result = await retryWithSlippage(swapFunction, {
    ...DEFAULT_SLIPPAGE_CONFIGS.pumpfun,
    maxSlippage,
  })

  if (!result.success) {
    Sentry.captureException(new Error(result.error))
    throw new Error(`Failed to buy token on Pump.fun: ${result.error}`)
  }

  return result.txSignature!
}

export async function createLiquidityPool(
  token: string,
  solAmount: number,
): Promise<string> {
  try {
    const response = await axios.post<PumpFunResponse>(
      `${NEXT_PUBLIC_PUMP_API_URL}/add-liquidity`,
      {
        tokenAddress: token,
        solAmount: solAmount,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_PUMPFUN_API_KEY || ''}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      },
    )

    if (!response.data.success) {
      throw new Error(response.data.error || 'Liquidity pool creation failed')
    }

    return response.data.poolAddress || `pump_pool_${token.slice(0, 8)}`
  } catch (error: any) {
    console.error(
      'Pump.fun pool creation error:',
      error.response?.data || error.message,
    )
    throw new Error(
      `Failed to create liquidity pool: ${error.response?.data?.error || error.message}`,
    )
  }
}

export async function getTokenInfo(tokenAddress: string): Promise<{
  name: string
  symbol: string
  marketCap: number
  liquidity: number
  priceUsd: number
  holders: number
}> {
  try {
    const response = await axios.get(
      `${NEXT_PUBLIC_PUMP_API_URL}/token/${tokenAddress}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_PUMPFUN_API_KEY || ''}`,
        },
        timeout: 10000,
      },
    )

    return {
      name: response.data.name || 'Unknown',
      symbol: response.data.symbol || 'UNKNOWN',
      marketCap: response.data.marketCap || 0,
      liquidity: response.data.liquidity || 0,
      priceUsd: response.data.priceUsd || 0,
      holders: response.data.holders || 0,
    }
  } catch (error: any) {
    console.error('Failed to get token info:', error)
    throw new Error(`Failed to get token info: ${error.message}`)
  }
}

export default {
  createToken,
  buyToken,
  createLiquidityPool,
  getTokenInfo,
}
