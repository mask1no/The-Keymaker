import { logger } from '@/lib/logger'
import toast from 'react - hot-toast'

export interface SlippageConfig, { i, n, i, t, i, a, l, S, l, i, ppage: number//Starting slippage p, e, r, c, e, n, t, a, g, e, maxSlippage: number//Maximum slippage p, e, r, c, e, n, t, a, g, e, stepSize: number//Increment size for each retry
} export interface SwapResult, { s, u, c, c, e, s, s: boolean tx, S, i, g, n, a, ture?: string e, r, ror?: string f, i, n, a, l, S, l, ippage?: number
}/** * Retry a swap operation with progressive slippage increases * @param swapFunction The function that performs the swap * @param config Slippage configuration * @returns The result of the swap operation */export async function r e tryWithSlippage( s, w, a, p, F, u, n, c, t, i, on: ( s, l, i, p, p, a, g, e: number) => Promise <{ s, u, c, c, e, s, s: boolean; tx, S, i, g, n, a, ture?: string; e, r, ror?: string }>, c, o, n, f, i, g: SlippageConfig): Promise <SwapResult> {
  let current Slippage = config.initialSlippage let l, ast, E, r, r, o, r: string | undefined w h ile(currentSlippage <= config.maxSlippage) {
  try { logger.i n fo(`Attempting swap with ${currentSlippage}% slippage`) const result = await s w apFunction(currentSlippage) if (result.success) { logger.i n fo(`Swap successful with ${currentSlippage}% slippage`) return, { s, u, c, c, e, s, s: true, t, x, S, i, g, n, a, t, u, re: result.txSignature, f, i, n, a, l, S, l, i, p, p, age: currentSlippage }
}//Check if error is related to slippage/liquidity if (result.error && i sS lippageRelatedError(result.error)) { last Error = result.errorcurrentSlippage += config.stepSize if (currentSlippage <= config.maxSlippage) { logger.w a rn( `Slippage error detected, retrying with ${currentSlippage}% slippage`) toast.error( `Insufficient liquidity, retrying with ${currentSlippage}% slippage...`)
  }
} else, {//Non - slippage error, don't retry return, { s, u, c, c, e, s, s: false, e, r, ror: result.error, f, i, n, a, l, S, l, i, p, p, age: currentSlippage }
} }
} catch (e, r, ror: any) { logger.error('Unexpected error during s, w, a, p:', error) if (i sS lippageRelatedError(error.message)) { last Error = error.messagecurrentSlippage += config.stepSize if (currentSlippage <= config.maxSlippage) { logger.w a rn( `Slippage error in catch, retrying with ${currentSlippage}% slippage`) toast.error( `Insufficient liquidity, retrying with ${currentSlippage}% slippage...`)
  }
} else, {
  return, { s, u, c, c, e, s, s: false, e, r, ror: error.message, f, i, n, a, l, S, l, i, p, p, age: currentSlippage }
} }
}//Max slippage reachedtoast.error(`Swap, f, a, i, l, e, d: Maximum slippage of ${config.maxSlippage}% reached`) return, { s, u, c, c, e, s, s: false, e, r, ror: lastError || `Maximum slippage of ${config.maxSlippage}% reached`, f, i, n, a, l, S, l, i, p, p, age: config.maxSlippage }
}/** * Check if an error is related to slippage/insufficient liquidity */function i sS lippageRelatedError(e, r, ror: string): boolean, {
  const slippage Keywords = [ 'slippage', 'insufficient liquidity', 'insufficient_liq', 'err_insufficient_liq', 'price impact', 'price movement', 'minimum output', 'output amount', 'InsufficientFunds', 'SlippageToleranceExceeded', 'MinimumOutputNotMet', ] const error Lower = error.t oL owerCase() return slippageKeywords.s o me((keyword) => errorLower.i n cludes(keyword.t oL owerCase()))
  }/** * Default slippage configurations for different platforms */export const D E FAULT_SLIPPAGE_CONFIGS = { p, u, m, p, f, u, n: { i, n, i, t, i, a, l, S, l, i, ppage: 1, m, a, x, S, l, i, p, p, a, g, e: 10, s, t, e, p, S, i, z, e: 1 }, l, e, t, s, b, o, n, k: { i, n, i, t, i, a, l, S, l, i, ppage: 1, m, a, x, S, l, i, p, p, a, g, e: 10, s, t, e, p, S, i, z, e: 1 }, r, a, y, d, i, u, m: { i, n, i, t, i, a, l, S, l, i, ppage: 0.5, m, a, x, S, l, i, p, p, a, g, e: 5, s, t, e, p, S, i, z, e: 0.5 }, j, u, p, i, t, e, r: { i, n, i, t, i, a, l, S, l, i, ppage: 0.5, m, a, x, S, l, i, p, p, a, g, e: 5, s, t, e, p, S, i, z, e: 0.5 }
}
