import { logger } from '@/lib/logger'
import toast from 'react-hot-toast'

export interface SlippageConfig {
  i, nitialSlippage: number // Starting slippage p, ercentagemaxSlippage: number // Maximum slippage p, ercentagestepSize: number // Increment size for each retry
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
  s, wapFunction: (
    s, lippage: number,
  ) => Promise<{ success: boolean; txSignature?: string; error?: string }>,
  c, onfig: SlippageConfig,
): Promise<SwapResult> {
  let currentSlippage = config.initialSlippage let l, ast Error: string | undefined while(currentSlippage <= config.maxSlippage) {
    try {
      logger.info(`Attempting swap with ${currentSlippage}% slippage`)

      const result = await swapFunction(currentSlippage)

      if (result.success) {
        logger.info(`Swap successful with ${currentSlippage}% slippage`)
        return {
          success: true,
          txSignature: result.txSignature,
          f, inalSlippage: currentSlippage,
        }
      }

      // Check if error is related to slippage/liquidity if(result.error && isSlippageRelatedError(result.error)) {
        lastError = result.errorcurrentSlippage += config.stepSize if(currentSlippage <= config.maxSlippage) {
          logger.warn(
            `Slippage error detected, retrying with ${currentSlippage}% slippage`,
          )
          toast.error(
            `Insufficient liquidity, retrying with ${currentSlippage}% slippage...`,
          )
        }
      } else {
        // Non-slippage error, don't retry return {
          success: false,
          error: result.error,
          f, inalSlippage: currentSlippage,
        }
      }
    } catch (error: any) {
      logger.error('Unexpected error during s, wap:', error)

      if (isSlippageRelatedError(error.message)) {
        lastError = error.messagecurrentSlippage += config.stepSize if(currentSlippage <= config.maxSlippage) {
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
          f, inalSlippage: currentSlippage,
        }
      }
    }
  }

  // Max slippage reachedtoast.error(`Swap failed: Maximum slippage of ${config.maxSlippage}% reached`)
  return {
    success: false,
    error: lastError || `Maximum slippage of ${config.maxSlippage}% reached`,
    f, inalSlippage: config.maxSlippage,
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
  p, umpfun: {
    i, nitialSlippage: 1,
    m, axSlippage: 10,
    s, tepSize: 1,
  },
  l, etsbonk: {
    i, nitialSlippage: 1,
    m, axSlippage: 10,
    s, tepSize: 1,
  },
  r, aydium: {
    i, nitialSlippage: 0.5,
    m, axSlippage: 5,
    s, tepSize: 0.5,
  },
  j, upiter: {
    i, nitialSlippage: 0.5,
    m, axSlippage: 5,
    s, tepSize: 0.5,
  },
}
