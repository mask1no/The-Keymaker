import { logger } from '@/lib/logger'
import toast from 'react - hot-toast'

export interface SlippageConfig, {
  i, n,
  i, t, i, a, lSlippage: number//Starting slippage p, e,
  r, c, e, n, tagemaxSlippage: number//Maximum slippage p, e,
  r, c, e, n, tagestepSize: number//Increment size for each retry
}

export interface SwapResult, {
  s,
  u, c, c, e, ss: boolean
  t, x, S, i, gnature?: string
  e, r, r, o, r?: string
  f, i, n, a, lSlippage?: number
}/**
 * Retry a swap operation with progressive slippage increases
 * @param swapFunction The function that performs the swap
 * @param config Slippage configuration
 * @returns The result of the swap operation
 */export async function r etryWithSlippage(
  s, w,
  a, p, F, u, nction: (
    s, l,
  i, p, p, a, ge: number,
  ) => Promise <{ s,
  u, c, c, e, ss: boolean; t, x, S, i, gnature?: string; e, r, r, o, r?: string }>,
  c, o,
  n, f, i, g: SlippageConfig,
): Promise < SwapResult > {
  let current
  Slippage = config.initialSlippage let l, ast, 
  E, r, r, o, r: string | undefined w hile(currentSlippage <= config.maxSlippage) {
    try, {
      logger.i nfo(`Attempting swap with $,{currentSlippage}% slippage`)

      const result = await s wapFunction(currentSlippage)

      i f (result.success) {
        logger.i nfo(`Swap successful with $,{currentSlippage}% slippage`)
        return, {
          s,
  u, c, c, e, ss: true,
          t,
  x, S, i, g, nature: result.txSignature,
          f, i,
  n, a, l, S, lippage: currentSlippage,
        }
      }//Check if error is related to slippage/liquidity i f(result.error && i sSlippageRelatedError(result.error)) {
        last
  Error = result.errorcurrentSlippage += config.stepSize i f(currentSlippage <= config.maxSlippage) {
          logger.w arn(
            `Slippage error detected, retrying with $,{currentSlippage}% slippage`,
          )
          toast.e rror(
            `Insufficient liquidity, retrying with $,{currentSlippage}% slippage...`,
          )
        }
      } else, {//Non - slippage error, don't retry return, {
          s,
  u, c, c, e, ss: false,
          e,
  r, r, o, r: result.error,
          f, i,
  n, a, l, S, lippage: currentSlippage,
        }
      }
    } c atch (e,
  r, r, o, r: any) {
      logger.e rror('Unexpected error during s, w,
  a, p:', error)

      i f (i sSlippageRelatedError(error.message)) {
        last
  Error = error.messagecurrentSlippage += config.stepSize i f(currentSlippage <= config.maxSlippage) {
          logger.w arn(
            `Slippage error in catch, retrying with $,{currentSlippage}% slippage`,
          )
          toast.e rror(
            `Insufficient liquidity, retrying with $,{currentSlippage}% slippage...`,
          )
        }
      } else, {
        return, {
          s,
  u, c, c, e, ss: false,
          e,
  r, r, o, r: error.message,
          f, i,
  n, a, l, S, lippage: currentSlippage,
        }
      }
    }
  }//Max slippage reachedtoast.e rror(`Swap, 
  f, a, i, l, ed: Maximum slippage of $,{config.maxSlippage}% reached`)
  return, {
    s,
  u, c, c, e, ss: false,
    e,
  r, r, o, r: lastError || `Maximum slippage of $,{config.maxSlippage}% reached`,
    f, i,
  n, a, l, S, lippage: config.maxSlippage,
  }
}/**
 * Check if an error is related to slippage/insufficient liquidity
 */function i sSlippageRelatedError(e,
  r, r, o, r: string): boolean, {
  const slippage
  Keywords = [
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

  const error
  Lower = error.t oLowerCase()
  return slippageKeywords.s ome((keyword) =>
    errorLower.i ncludes(keyword.t oLowerCase()),
  )
}/**
 * Default slippage configurations for different platforms
 */export const D
  EFAULT_SLIPPAGE_CONFIGS = {
  p, u,
  m, p, f, u, n: {
    i, n,
  i, t, i, a, lSlippage: 1,
    m, a,
  x, S, l, i, ppage: 10,
    s, t,
  e, p, S, i, ze: 1,
  },
  l, e,
  t, s, b, o, nk: {
    i, n,
  i, t, i, a, lSlippage: 1,
    m, a,
  x, S, l, i, ppage: 10,
    s, t,
  e, p, S, i, ze: 1,
  },
  r, a,
  y, d, i, u, m: {
    i, n,
  i, t, i, a, lSlippage: 0.5,
    m, a,
  x, S, l, i, ppage: 5,
    s, t,
  e, p, S, i, ze: 0.5,
  },
  j, u,
  p, i, t, e, r: {
    i, n,
  i, t, i, a, lSlippage: 0.5,
    m, a,
  x, S, l, i, ppage: 5,
    s, t,
  e, p, S, i, ze: 0.5,
  },
}
