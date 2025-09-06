import axios from 'axios'
import { Keypair } from '@solana/web3.js'
// import { logTokenLaunch } from './executionLogService' // Dynamic import below
import { retryWithSlippage, DEFAULT_SLIPPAGE_CONFIGS } from './slippageRetry'
import { logger } from '@/lib/logger'
import * as Sentry from '@sentry/nextjs'
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

/**
 * Create a token on letsbonk.fun platform
 * This integrates with the Python MCP backend for actual token creation
 */
export async function createToken(
  name: string,
  symbol: string,
  supply: number,
  metadata: TokenMetadata,
  payer: Keypair,
): Promise<string> {
  try {
    // Call Python backend via API proxy
    const response = await axios.post(
      '/api/proxy',
      {
        method: 'launch-token',
        params: {
          name: name.slice(0, 32),
          symbol: symbol.slice(0, 10),
          description:
            metadata.description || `${name} - Created with The Keymaker`,
          twitter: metadata.twitter || '',
          telegram: metadata.telegram || '',
          website: metadata.website || '',
          imageUrl: metadata.image || '',
          keypair: payer.secretKey.toString(), // Will be handled securely in proxy
        },
      },
      {
        timeout: 60000, // 60 seconds for token creation
      },
    )

    const result = response.data

    if (!result.success || !result.mintAddress) {
      throw new Error(result.error || 'Token creation failed')
    }

    // Log token launch
    try {
      const { logTokenLaunch } = await import('./executionLogService')
      await logTokenLaunch({
        tokenAddress: result.mintAddress,
        name,
        symbol,
        platform: 'letsbonk.fun',
        supply: supply.toString(),
        decimals: result.decimals || 6,
        launcherWallet: payer.publicKey.toBase58(),
        transactionSignature: result.txSignature || '',
        liquidityPoolAddress: result.poolAddress,
      })
    } catch (e) {
      // Logging failed, continue without error
      console.warn('Failed to log token launch:', e)
    }

    return result.mintAddress
  } catch (error: any) {
    Sentry.captureException(error)
    console.error(
      'LetsBonk token creation error:',
      error.response?.data || error.message,
    )

    // Check if it's a 4xx/429 error and try Puppeteer fallback (assuming LetsBonk uses similar captcha)
    if (error.response?.status >= 400 && error.response?.status < 500) {
      logger.warn(
        'LetsBonk API returned 4xx error, attempting Puppeteer fallback...',
      )

      try {
        const puppeteerHelper = getPuppeteerHelper()
        const puppeteerResult = await puppeteerHelper.launchLetsBonk(
          {
            name,
            symbol,
            description:
              metadata.description || `${name} - Created with The Keymaker`,
            imageUrl: metadata.image || '',
            twitter: metadata.twitter,
            telegram: metadata.telegram,
            website: metadata.website,
          },
          payer.secretKey.toString(),
        )

        // Log token launch with puppeteer result
        try {
          const { logTokenLaunch } = await import('./executionLogService')
          await logTokenLaunch({
            tokenAddress: puppeteerResult.mint,
            name,
            symbol,
            platform: 'LetsBonk (Puppeteer)',
            supply: supply.toString(),
            decimals: 6,
            launcherWallet: payer.publicKey.toBase58(),
            transactionSignature: puppeteerResult.txHash || '',
            liquidityPoolAddress: puppeteerResult.lp || '',
          })
        } catch (e) {
          // Logging failed, continue without error
          console.warn('Failed to log token launch:', e)
        }

        return puppeteerResult.mint
      } catch (puppeteerError) {
        logger.error('Puppeteer fallback failed for LetsBonk:', puppeteerError)
        throw new Error(
          `Failed to create token on LetsBonk: ${error.response?.data?.error || error.message} (Puppeteer fallback also failed)`,
        )
      }
    }

    throw new Error(
      `Failed to create token on LetsBonk: ${error.response?.data?.error || error.message}`,
    )
  }
}

/**
 * Buy tokens on letsbonk.fun with automatic slippage retry
 */
export async function buyToken(
  tokenMint: string,
  amountSol: number,
  buyer: Keypair,
  maxSlippage = 10,
): Promise<string> {
  const swapFunction = async (slippage: number) => {
    try {
      // Call Python backend via API proxy
      const response = await axios.post(
        '/api/proxy',
        {
          method: 'buy-token',
          params: {
            tokenMint,
            amountSol,
            slippage,
            keypair: buyer.secretKey.toString(),
          },
        },
        {
          timeout: 30000,
        },
      )

      const result = response.data

      if (result.success && result.txSignature) {
        return {
          success: true,
          txSignature: result.txSignature,
        }
      }

      return {
        success: false,
        error: result.error || 'Token purchase failed',
      }
    } catch (error: any) {
      logger.error('LetsBonk buy error:', error)
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  }

  // Use retry logic with progressive slippage
  const result = await retryWithSlippage(swapFunction, {
    ...DEFAULT_SLIPPAGE_CONFIGS.letsbonk,
    maxSlippage,
  })

  if (!result.success) {
    Sentry.captureException(new Error(result.error))
    throw new Error(`Failed to buy token on LetsBonk: ${result.error}`)
  }

  return result.txSignature!
}

export async function createLiquidityPool(token: string): Promise<string> {
  // LetsBonk handles liquidity automatically during token creation
  // This is a no-op for compatibility
  return token
}

export default {
  createToken,
  buyToken,
  createLiquidityPool,
}
