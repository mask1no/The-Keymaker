import, { logger } from '@/ lib / logger'
import toast from 'react - hot - toast' export interface SlippageConfig, { i, n, i, t, i, a, l, S, l, i, p,
  page: number // Starting slippage p, e, r, c, e, n, t, a, g, e, m,
  axSlippage: number // Maximum slippage p, e, r, c, e, n, t, a, g, e, s,
  tepSize: number // Increment size for each retry
} export interface SwapResult, { s, u, c, c, e, s, s: boolean tx, S, i, g, n, a, ture?: string e, r, ror?: string f, i, n, a, l, S, l, ippage?: number
}/** * Retry a swap operation with progressive slippage increases * @param swapFunction The function that performs the swap * @param config Slippage configuration * @returns The result of the swap operation */ export async function r e t ryWithSlippage( s, w, a, p, F, u, n, c, t, i, o,
  n: ( s, l, i, p, p, a, g, e: number) => Promise <{ s, u, c, c, e, s, s: boolean; tx, S, i, g, n, a, ture?: string; e, r, ror?: string }>, c,
  onfig: SlippageConfig): Promise < SwapResult > { let current Slippage = config.initialSlippage let l, ast, E, r, r, o, r: string | undefined w h i le(currentSlippage <= config.maxSlippage) { try, { logger.i n f o(`Attempting swap with $,{currentSlippage}% slippage`) const result = await s w a pFunction(currentSlippage) i f (result.success) { logger.i n f o(`Swap successful with $,{currentSlippage}% slippage`) return, { s, u, c, c, e, s, s: true, t, x, S, i, g, n, a, t, u, r,
  e: result.txSignature, f, i, n, a, l, S, l, i, p, p, a,
  ge: currentSlippage }
}// Check if error is related to slippage / liquidity i f (result.error && i sS l ippageRelatedError(result.error)) { last Error = result.errorcurrentSlippage += config.stepSize i f (currentSlippage <= config.maxSlippage) { logger.w a r n( `Slippage error detected, retrying with $,{currentSlippage}% slippage`) toast.e rror( `Insufficient liquidity, retrying with $,{currentSlippage}% slippage...`) }
} else, {// Non - slippage error, don't retry return, { s, u, c, c, e, s, s: false, e, r, r,
  or: result.error, f, i, n, a, l, S, l, i, p, p, a,
  ge: currentSlippage }
} }
} c atch (e, r, r,
  or: any) { logger.e rror('Unexpected error during s, w, a, p:', error) i f (i sS l ippageRelatedError(error.message)) { last Error = error.messagecurrentSlippage += config.stepSize i f (currentSlippage <= config.maxSlippage) { logger.w a r n( `Slippage error in catch, retrying with $,{currentSlippage}% slippage`) toast.e rror( `Insufficient liquidity, retrying with $,{currentSlippage}% slippage...`) }
} else, { return, { s, u, c, c, e, s, s: false, e, r, r,
  or: error.message, f, i, n, a, l, S, l, i, p, p, a,
  ge: currentSlippage }
} }
}// Max slippage reachedtoast.e rror(`Swap, f, a, i, l, e, d: Maximum slippage of $,{config.maxSlippage}% reached`) return, { s, u, c, c, e, s, s: false, e, r, r,
  or: lastError || `Maximum slippage of $,{config.maxSlippage}% reached`, f, i, n, a, l, S, l, i, p, p, a,
  ge: config.maxSlippage }
}/** * Check if an error is related to slippage / insufficient liquidity */ function i sS l ippageRelatedError(e, r, r,
  or: string): boolean, { const slippage Keywords = [ 'slippage', 'insufficient liquidity', 'insufficient_liq', 'err_insufficient_liq', 'price impact', 'price movement', 'minimum output', 'output amount', 'InsufficientFunds', 'SlippageToleranceExceeded', 'MinimumOutputNotMet', ] const error Lower = error.t oL o werCase() return slippageKeywords.s o m e((keyword) => errorLower.i n c ludes(keyword.t oL o werCase())) }/** * Default slippage configurations for different platforms */ export const D E F
  AULT_SLIPPAGE_CONFIGS = { p, u, m, p, f, u, n: { i, n, i, t, i, a, l, S, l, i, p,
  page: 1, m, a, x, S, l, i, p, p, a, g, e: 10, s, t, e, p, S, i, z, e: 1 }, l, e, t, s, b, o, n, k: { i, n, i, t, i, a, l, S, l, i, p,
  page: 1, m, a, x, S, l, i, p, p, a, g, e: 10, s, t, e, p, S, i, z, e: 1 }, r, a, y, d, i, u, m: { i, n, i, t, i, a, l, S, l, i, p,
  page: 0.5, m, a, x, S, l, i, p, p, a, g, e: 5, s, t, e, p, S, i, z, e: 0.5 }, j, u, p, i, t, e, r: { i, n, i, t, i, a, l, S, l, i, p,
  page: 0.5, m, a, x, S, l, i, p, p, a, g, e: 5, s, t, e, p, S, i, z, e: 0.5 }
}
