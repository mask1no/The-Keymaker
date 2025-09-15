import { logger } from '@/lib/logger'
import toast from 'react-hot-toast'

export interface SlippageConfig {
  initialSlippage: number // Starting slippage percentagemaxSlippage: number // Maximum slippage percentagestepSize: number // Increment size for each retry
}

export interface SwapResult {
  success: booleantxSignature?: stringerror?: stringfinalSlippage?: number
}

/**
 * Retry a swap operation with progressive slippage increases
 * @param swapFunction The function that performs the swap
 * @param config Slippage configuration
 * @returns The result of the swap operation
 */
export async function retryWithSlippage(
  swapFunction: (
    slippage: number,
  ) => Promise<{ success: boolean; txSignature?: string; error?: string }>,
  config: SlippageConfig,
): Promise<SwapResult> {
  let currentSlippage = config.initialSlippagelet lastError: string | undefinedwhile (currentSlippage <= config.maxSlippage) {
    try {
      logger.info(`Attempting swap with ${currentSlippage}% slippage`)

      const result = await swapFunction(currentSlippage)

      if (result.success) {
        logger.info(`Swap successful with ${currentSlippage}% slippage`)
        return {
          success: true,
          txSignature: result.txSignature,
          finalSlippage: currentSlippage,
        }
      }

      // Check if error is related to slippage/liquidityif (result.error && isSlippageRelatedError(result.error)) {
        lastError = result.errorcurrentSlippage += config.stepSizeif (currentSlippage <= config.maxSlippage) {
          logger.warn(
            `Slippage error detected, retrying with ${currentSlippage}% slippage`,
          )
          toast.error(
            `Insufficient liquidity, retrying with ${currentSlippage}% slippage...`,
          )
        }
      } else {
        // Non-slippage error, don't retryreturn {
          success: false,
          error: result.error,
          finalSlippage: currentSlippage,
        }
      }
    } catch (error: any) {
      logger.error('Unexpected error during swap:', error)

      if (isSlippageRelatedError(error.message)) {
        lastError = error.messagecurrentSlippage += config.stepSizeif (currentSlippage <= config.maxSlippage) {
          logger.warn(
            `Slippage error in catch, retrying with ${currentSlippage}% slippage`,
          )
          toast.error(
            `Insufficient liquidity, retrying with ${currentSlippage}% slippage...`,
          )
        }
      } else {
        return {
          success: false,
          error: error.message,
          finalSlippage: currentSlippage,
        }
      }
    }
  }

  // Max slippage reachedtoast.error(`Swap failed: Maximum slippage of ${config.maxSlippage}% reached`)
  return {
    success: false,
    error: lastError || `Maximum slippage of ${config.maxSlippage}% reached`,
    finalSlippage: config.maxSlippage,
  }
}

/**
 * Check if an error is related to slippage/insufficient liquidity
 */
function isSlippageRelatedError(error: string): boolean {
  const slippageKeywords = [
    'slippage',
    'insufficient liquidity',
    'insufficient_liq',
    'err_insufficient_liq',
    'price impact',
    'price movement',
    'minimum output',
    'output amount',
    'InsufficientFunds',
    'SlippageToleranceExceeded',
    'MinimumOutputNotMet',
  ]

  const errorLower = error.toLowerCase()
  return slippageKeywords.some((keyword) =>
    errorLower.includes(keyword.toLowerCase()),
  )
}

/**
 * Default slippage configurations for different platforms
 */
export const DEFAULT_SLIPPAGE_CONFIGS = {
  pumpfun: {
    initialSlippage: 1,
    maxSlippage: 10,
    stepSize: 1,
  },
  letsbonk: {
    initialSlippage: 1,
    maxSlippage: 10,
    stepSize: 1,
  },
  raydium: {
    initialSlippage: 0.5,
    maxSlippage: 5,
    stepSize: 0.5,
  },
  jupiter: {
    initialSlippage: 0.5,
    maxSlippage: 5,
    stepSize: 0.5,
  },
}
