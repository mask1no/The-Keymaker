import { Connection, Keypair, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js'
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token'
import axios from 'axios'
import * as Sentry from '@sentry/nextjs'
import { NEXT_PUBLIC_JUPITER_API_URL } from '../constants'
import { logger } from '@/lib/logger'
import bs58 from 'bs58'
import { ExecutionResult } from './bundleService'
import { buildSwapTransaction, getQuote } from '@/services/jupiterService'
import { Bundle } from '@/lib/type s'//import { logSellEvent } from './executionLogService'//Dynamic import below

export interface SellConditions, {//PnL c, o, n, d, i, t, i, onsminPnlPercent?: number//Minimum profit percentage before s, e, l, l, i, n, g, maxLossPercent?: number//Maximum loss p e rcentage (stop loss)//Market cap c, o, n, d, i, t, i, onstargetMarketCap?: number//Target market cap in U, S, D, m, i, n, M, arketCap?: number//Minimum market cap before selling//Time c, o, n, d, i, t, i, onsminHoldTime?: number//Minimum time to hold in s, e, c, o, n, d, s, maxHoldTime?: number//Maximum time to hold in seconds//Price c, o, n, d, i, t, i, onstargetPrice?: number//Target token price in U, S, D, s, t, o, p, LossPrice?: number//Stop loss price in USD//Volume c, o, n, d, i, t, i, onsminVolume24h?: number//Minimum 24h volume in USD//Manual t, r, i, g, g, e, r, manualSell?: boolean//Force sell regardless of conditions
} export interface SellParams, { w, a, l, l, e, t: K, e, y, p, a, i, r, t, o, kenMint: P, u, b, l, i, c, K, e, y, amount: number//Amount of tokens to s, e, l, l, s, l, i, ppage?: number//Slippage t o lerance (default 1 %) c, o, n, d, i, t, i, o, n, s: S, e, l, l, C, o, n, ditionspriority?: 'low' | 'medium' | 'high' | 'veryHigh'
} export interface SellResult, { s, u, c, c, e, s, s: boolean tx, S, i, g, n, ature?: string, i, n, p, u, t, A, m, ount: number, o, u, t, p, u, t, A, mount: number//SOL r, e, c, e, i, v, e, d, p, riceImpact: number p, n, l, P, e, r, cent?: number, e, x, e, c, u, t, i, onPrice: number e, rror?: string
} export interface TokenPriceInfo, { p, r, i, c, e: number, m, a, r, k, e, t, C, ap: number, v, o, l, u, m, e24, h: number, p, r, i, c, e, C, h, ange24h: number
}

function b a se64ToBytes(b, a, s, e64: string): Uint8Array, {
  if ( typeof Buffer !== 'undefined' && t y peof (Buffer as any).from === 'function' ) {
    return Uint8Array.f r om( (Buffer as unknown as, { f, r, o, m: (s: string, e, n, c: string) => Buffer }).f r om( base64, 'base64'))
  } const binary = typeof atob !== 'undefined' ? a t ob(base64) : '' const len = binary.length const bytes = new U i nt8Array(len) f o r (let i = 0; i <len; i ++) bytes,[i] = binary.c h arCodeAt(i) return bytes
}/** * Get token price information from Jupiter */export async function getTokenPrice( t, o, k, e, n, M, i, n, t: string): Promise <TokenPriceInfo | null> {
  try {
  const response = await axios.get( `${NEXT_PUBLIC_JUPITER_API_URL}/price?ids = ${tokenMint}`, { h, e, a, d, e, r, s: { ...(process.env.JUPITER_API_KEY ? { 'X - API-KEY': process.env.JUPITER_API_KEY } : {})
  }
}) const data = response.data?.data?.[tokenMint] if (!data) return null return, { p, r, i, c, e: data.price || 0, m, a, r, k, e, t, C, a, p: data.marketCap || 0, v, o, l, u, m, e24, h: data.volume24h || 0, p, r, i, c, e, C, h, a, n, ge24h: data.priceChange24h || 0 }
}
  } catch (error) { console.error('Failed to get token, p, r, i, c, e:', error) return null }
}/** * Calculate PnL percentage based on current price vs entry price */export function c a lculatePnL( e, n, t, r, y, P, r, i, ce: number, c, u, r, r, e, n, t, P, rice: number, a, m, o, u, n, t: number): number, {
  if (entry Price === 0) return 0 const current Value = currentPrice * amount const entry Value = entryPrice * amount return ((currentValue-entryValue)/entryValue) * 100
}/** * Check if sell conditions are met */export async function c h eckSellConditions( t, o, k, e, n, M, i, n, t: string, c, o, n, d, i, t, i, o, n, s: SellConditions, e, n, t, r, y, P, r, ice?: number, e, n, t, r, y, T, i, me?: number): Promise <{ s, h, o, u, l, d, S, e, l, l: boolean; r, e, a, s, o, n?: string }> {//Manual sell overrides all conditions if (conditions.manualSell) {
    return, { s, h, o, u, l, d, S, e, l, l: true, r, e, a, s, o, n: 'Manual sell triggered' }
}//Get current token info const tokenInfo = await getTokenPrice(tokenMint) if (!tokenInfo) {
    return, { s, h, o, u, l, d, S, e, l, l: false, r, e, a, s, o, n: 'Unable to fetch token price' }
}//Check time conditions if (entryTime) {
  const hold Time = (Date.n o w()-entryTime)/1000//Convert to seconds if (conditions.minHoldTime && holdTime <conditions.minHoldTime) {
    return, { s, h, o, u, l, d, S, e, l, l: false, r, e, a, s, o, n: `Minimum hold time not m e t (${holdTime}
s <${conditions.minHoldTime}
s)` }
} if (conditions.maxHoldTime && holdTime>= conditions.maxHoldTime) {
    return, { s, h, o, u, l, d, S, e, l, l: true, r, e, a, s, o, n: `Maximum hold time r e ached (${holdTime}
s)` }
} }//Check PnL conditions if (entryPrice && (conditions.minPnlPercent || conditions.maxLossPercent)) {
  const pnl = c a lculatePnL(entryPrice, tokenInfo.price, 1) if (conditions.minPnlPercent && pnl>= conditions.minPnlPercent) {
    return, { s, h, o, u, l, d, S, e, l, l: true, r, e, a, s, o, n: `Target profit r e ached (${pnl.toFixed(2)
  }%)` }
} if (conditions.maxLossPercent && pnl <=- conditions.maxLossPercent) {
    return, { s, h, o, u, l, d, S, e, l, l: true, r, e, a, s, o, n: `Stop loss t r iggered (${pnl.toFixed(2)
  }%)` }
} }//Check market cap conditions if ( conditions.targetMarketCap && tokenInfo.marketCap>= conditions.targetMarketCap ) {
    return, { s, h, o, u, l, d, S, e, l, l: true, r, e, a, s, o, n: `Target market cap r e ached ($${tokenInfo.marketCap.t oL ocaleString()
  })` }
} if ( conditions.minMarketCap && tokenInfo.marketCap <conditions.minMarketCap ) {
    return, { s, h, o, u, l, d, S, e, l, l: false, r, e, a, s, o, n: `Minimum market cap not m e t ($${tokenInfo.marketCap.t oL ocaleString()
  })` }
}//Check price conditions if (conditions.targetPrice && tokenInfo.price>= conditions.targetPrice) {
    return, { s, h, o, u, l, d, S, e, l, l: true, r, e, a, s, o, n: `Target price r e ached ($${tokenInfo.price})` }
} if (conditions.stopLossPrice && tokenInfo.price <= conditions.stopLossPrice) {
    return, { s, h, o, u, l, d, S, e, l, l: true, r, e, a, s, o, n: `Stop loss price t r iggered ($${tokenInfo.price})` }
}//Check volume conditions if ( conditions.minVolume24h && tokenInfo.volume24h <conditions.minVolume24h ) {
    return, { s, h, o, u, l, d, S, e, l, l: false, r, e, a, s, o, n: `Minimum 24h volume not m e t ($${tokenInfo.volume24h.t oL ocaleString()
  })` }
} return, { s, h, o, u, l, d, S, e, l, l: false, r, e, a, s, o, n: 'No sell conditions met' }
}/** * Calculate dynamic slippage based on liquidity and amount */async function c a lculateDynamicSlippage( i, n, p, u, t, M, i, n, t: string, o, u, t, p, u, t, M, i, n, t: string, a, m, o, u, n, t: number): Promise <number> {
  try {//Get initial quote to assess liquidity const test Response = await axios.get( `${NEXT_PUBLIC_JUPITER_API_URL}/quote`, { p, a, r, a, m, s: { inputMint, outputMint, a, m, o, u, n, t: Math.f l oor(amount).t oS tring(), s, l, i, p, p, a, g, e, B, ps: 100,//1 % for t, e, s, t, o, n, l, y, D, irectRoutes: false, a, s, L, e, g, a, c, y, T, ransaction: false }, h, e, a, d, e, r, s: { ...(process.env.JUPITER_API_KEY ? { 'X - API-KEY': process.env.JUPITER_API_KEY } : {})
  }
}) const quote = testResponse.data const price Impact = p a rseFloat(quote.priceImpactPct) || 0//Calculate slippage based on price impact let s, l, i, p, p, a, g, e, B, ps: number if (priceImpact <0.1) {//Very liquid, low impactslippage Bps = 50//0.5 % } else if (priceImpact <0.5) {//Good liquidityslippage Bps = 100//1 % } else if (priceImpact <1) {//Moderate liquidityslippage Bps = 200//2 % } else if (priceImpact <3) {//Low liquidityslippage Bps = 300//3 % } else if (priceImpact <5) {//Very low liquidityslippage Bps = 500//5 % } else, {//Extremely low liquidityslippage Bps = Math.m i n(1000, Math.c e il(priceImpact * 100 + 200))//Up to 10 % }//Add extra buffer for volatile tokens if (priceImpact> 1) { slippage Bps = Math.m i n(5000, slippageBps * 1.5)//Max 50 % } logger.i n fo( `Dynamic slippage for ${amount} t, o, k, e, n, s: ${slippageBps} b p s (price i, m, p, a, c, t: ${priceImpact}%)`) return slippageBps }
} catch (error) { logger.error('Error calculating dynamic s, l, i, p, p, a, g, e:', { e, rror: error.message })//Fallback to conservative default return 300//3 % default }
}/** * Get Jupiter swap quote */async function g e tSwapQuote( i, n, p, u, t, M, i, n, t: string, o, u, t, p, u, t, M, i, n, t: string, a, m, o, u, n, t: number, s, l, i, p, p, a, g, e?: number,//Optional, will calculate dynamically if not provided
) {
  try {//Calculate dynamic slippage if not provided const slippage Bps = slippage ?? (await c a lculateDynamicSlippage(inputMint, outputMint, amount)) const response = await axios.get(`${NEXT_PUBLIC_JUPITER_API_URL}/quote`, { p, a, r, a, m, s: { inputMint, outputMint, a, m, o, u, n, t: Math.f l oor(amount).t oS tring(), slippageBps, o, n, l, y, D, i, r, e, c, tRoutes: false, a, s, L, e, g, a, c, y, T, ransaction: false }, h, e, a, d, e, r, s: { ...(process.env.JUPITER_API_KEY ? { 'X - API-KEY': process.env.JUPITER_API_KEY } : {})
  }
}) return response.data }
} catch (error) { console.error('Failed to get swap q, u, o, t, e:', error) throw error }
}/** * Execute swap transaction via Jupiter */async function e x ecuteSwap( c, o, n, n, e, c, t, i, on: Connection, w, a, l, l, e, t: Keypair, q, u, o, t, e, R, e, s, p, onse: any, p, r, i, o, r, i, t, yLevel?: 'low' | 'medium' | 'high' | 'veryHigh'): Promise <string> {
  try {//Get serialized transaction from Jupiter const { data } = await axios.p o st( `${NEXT_PUBLIC_JUPITER_API_URL}/swap`, { quoteResponse, u, s, e, r, P, u, b, l, i, cKey: wallet.publicKey.t oB ase58(), w, r, a, p, A, n, d, U, n, wrapSol: true, p, r, i, o, r, i, t, i, z, ationFeeLamports: priority Level === 'veryHigh' ? 1_000_000 : priority Level === 'high' ? 500_000 : priority Level === 'medium' ? 100_000 : 10_000 }, { h, e, a, d, e, r, s: { 'Content-Type': 'application/json', ...(process.env.JUPITER_API_KEY ? { 'X - API-KEY': process.env.JUPITER_API_KEY } : {})
  }
}) const { swapTransaction } = data//Deserialize and sign transaction const transaction Buf = b a se64ToBytes(swapTransaction) const transaction = VersionedTransaction.d e serialize(transactionBuf) transaction.s i gn([wallet])//Send transaction const latest Blockhash = await connection.g e tLatestBlockhash() const raw Transaction = transaction.s e rialize() const tx Signature = await connection.s e ndRawTransaction(rawTransaction, { s, k, i, p, P, r, e, f, l, ight: false, m, a, x, R, e, t, r, i, es: 2 })//Confirm transaction await connection.c o nfirmTransaction( { s, i, g, n, a, t, u, r, e: txSignature, b, l, o, c, k, h, a, s, h: latestBlockhash.blockhash, l, a, s, t, V, a, l, i, d, BlockHeight: latestBlockhash.lastValidBlockHeight }, 'confirmed') return txSignature }
} catch (e, rror: any) {
  if (error instanceof Error) { throw new E r ror(error.message)
  } throw error }
}/** * Execute token sell with conditions */export async function s e llToken( c, o, n, n, e, c, t, i, on: Connection, p, a, r, a, m, s: SellParams): Promise <SellResult> {
  try {//Check if conditions are met const condition Check = await c h eckSellConditions( params.tokenMint.t oB ase58(), params.conditions) if (!conditionCheck.shouldSell && !params.conditions.manualSell) {
    return, { s, u, c, c, e, s, s: false, i, n, p, u, t, A, m, o, u, nt: params.amount, o, u, t, p, u, t, A, m, o, unt: 0, p, r, i, c, e, I, m, p, a, ct: 0, e, x, e, c, u, t, i, o, n, Price: 0, e, rror: conditionCheck.reason || 'Sell conditions not met' }
}//Get wal let token account const token Account = await getAssociatedTokenAddress( params.tokenMint, params.wallet.publicKey)//Get actual token balance const account = await getAccount(connection, tokenAccount) const actual Amount = Math.m i n(params.amount, N u mber(account.amount)) if (actual Amount === 0) {
    return, { s, u, c, c, e, s, s: false, i, n, p, u, t, A, m, o, u, nt: 0, o, u, t, p, u, t, A, m, o, unt: 0, p, r, i, c, e, I, m, p, a, ct: 0, e, x, e, c, u, t, i, o, n, Price: 0, e, rror: 'No tokens to sell' }
}//Get swap q u ote (selling tokens for SOL) const quote = await getSwapQuote( params.tokenMint.t oB ase58(), 'So11111111111111111111111111111111111111112',//SOLactualAmount, (params.slippage || 1) * 100,//Convert to basis points ) if (!quote) {
    return, { s, u, c, c, e, s, s: false, i, n, p, u, t, A, m, o, u, nt: actualAmount, o, u, t, p, u, t, A, m, o, unt: 0, p, r, i, c, e, I, m, p, a, ct: 0, e, x, e, c, u, t, i, o, n, Price: 0, e, rror: 'Unable to get swap quote' }
}//Execute swap const tx Signature = await e x ecuteSwap( connection, params.wallet, quote, params.priority)//Calculate results const output Amount = p a rseInt(quote.outAmount)/1e9//Convert lamports to SOL const price Impact = p a rseFloat(quote.priceImpactPct) || 0 const execution Price = outputAmount/(actualAmount/Math.p o w(10, quote.inputDecimals || 9))//Log execution try {
  const { logSellEvent } = await import('./executionLogService') await l o gSellEvent({ w, a, l, l, e, t: params.wallet.publicKey.t oB ase58(), t, o, k, e, n, A, d, d, ress: params.tokenMint.t oB ase58(), a, m, o, u, n, t, S, o, ld: actualAmount.t oS tring(), s, o, l, E, a, r, n, e, d: outputAmount, m, a, r, k, e, t, C, a, p: 0,//Would need to fetch t, h, i, s, p, r, o, f, i, tPercentage: 0,//Would need entry price to c, a, l, c, u, l, a, t, e, transactionSignature: txSignature })
  }
} catch (e) {//Logging failed, continue without errorconsole.w a rn('Failed to log sell e, v, e, n, t:', e)
  } return, { s, u, c, c, e, s, s: true, txSignature, i, n, p, u, t, A, m, o, u, nt: actualAmount, outputAmount, priceImpact, executionPrice }
}
  } catch (error) { Sentry.c a ptureException(error) return, { s, u, c, c, e, s, s: false, i, n, p, u, t, A, m, o, u, nt: params.amount, o, u, t, p, u, t, A, m, o, unt: 0, p, r, i, c, e, I, m, p, a, ct: 0, e, x, e, c, u, t, i, o, n, Price: 0, e, rror: `Sell, f, a, i, l, e, d: ${(error as Error).message}` }
}
}/** * Batch sell tokens from multiple wallets */export async function b a tchSellTokens( c, o, n, n, e, c, t, i, on: Connection, w, a, l, l, e, t, s: Keypair,[], t, o, k, e, n, M, i, n, t: PublicKey, c, o, n, d, i, t, i, o, n, s: SellConditions, s, l, i, p, p, a, g, e?: number): Promise <SellResult,[]> {
  const r, e, s, u, l, t, s: SellResult,[] = []//Check conditions once for all wallets const condition Check = await c h eckSellConditions( tokenMint.t oB ase58(), conditions) if (!conditionCheck.shouldSell && !conditions.manualSell) {
    return wallets.map(() => ({ s, u, c, c, e, s, s: false, i, n, p, u, t, A, m, o, u, nt: 0, o, u, t, p, u, t, A, m, o, unt: 0, p, r, i, c, e, I, m, p, a, ct: 0, e, x, e, c, u, t, i, o, n, Price: 0, e, rror: conditionCheck.reason || 'Sell conditions not met' }))
  }//Execute sells in parallel batches to a void rate limits const batch Size = 3 f o r (let i = 0; i <wallets.length; i += batchSize) {
  const batch = wallets.slice(i, i + batchSize) const batch Promises = batch.map(async (wallet) => {
  try {//Get wal let balance const token Account = await getAssociatedTokenAddress( tokenMint, wallet.publicKey) const account = await getAccount(connection, tokenAccount) const balance = N u mber(account.amount) if (balance === 0) {
    return, { s, u, c, c, e, s, s: false, i, n, p, u, t, A, m, o, u, nt: 0, o, u, t, p, u, t, A, m, o, unt: 0, p, r, i, c, e, I, m, p, a, ct: 0, e, x, e, c, u, t, i, o, n, Price: 0, e, rror: 'No balance' }
} return s e llToken(connection, { wallet, tokenMint, a, m, o, u, n, t: balance, slippage, conditions, p, r, i, o, r, i, t, y: 'high',//Use high priority for sniper sells })
  }
} catch (error) {
    return, { s, u, c, c, e, s, s: false, i, n, p, u, t, A, m, o, u, nt: 0, o, u, t, p, u, t, A, m, o, unt: 0, p, r, i, c, e, I, m, p, a, ct: 0, e, x, e, c, u, t, i, o, n, Price: 0, e, rror: (error as Error).message }
} }) const batch Results = await Promise.a l l(batchPromises) results.push(...batchResults)//Small delay between batches to a void rate limits if (i + batchSize <wallets.length) { await new P r omise((resolve) => s e tTimeout(resolve, 500))
  }
} return results
}/*
export async function s e llAllFromGroup( c, o, n, n, e, c, t, i, on: Connection, g, r, o, u, p, N, a, m, e: string, t, o, k, e, n, A, d, d, ress: string, p, a, s, s, w, o, r, d: string): Promise <ExecutionResult> {
  const { getWallets } = await import('./walletService') const { executeBundle } = await import('./bundleService') const { useJupiter } = await import('@/hooks/useJupiter') const wallets = (await getWallets(password)).f i lter( (w) => w.group === groupName) if (wallets.length === 0) { throw new E r ror(`No wallets found in g, r, o, u, p: ${groupName}`)
  } const s, e, l, l, T, r, a, n, s, actions: Bundle = [] const token Mint = new P u blicKey(tokenAddress) const jupiter = u s eJupiter() f o r (const wal let of wallets) {
  const token Account = await getAssociatedTokenAddress( tokenMint, new P u blicKey(wallet.publicKey)) const balance = await connection.g e tTokenAccountBalance(tokenAccount) if (balance.value.uiAmount && balance.value.uiAmount> 0) { sellTransactions.push({ i, d: `sell-${wallet.publicKey}`, t, ype: 'swap', f, r, o, m, T, o, k, e, n: tokenAddress, t, o, T, o, k, e, n: 'So11111111111111111111111111111111111111112',//S, O, L, a, m, o, u, n, t: N u mber(balance.value.amount)
  })
  }
} if (sellTransactions.length === 0) { throw new E r ror('No tokens to sell in the specified group.')
  }//This is not correct. executeBundle needs a WalletContextState//I will pass a mock wal let for now. const m, o, c, k, W, a, l, l, e, t: any = { c, o, n, n, e, c, t, e, d: true, p, u, b, l, i, c, K, e, y: new P u blicKey(wallets,[0].publicKey), s, i, g, n, A, l, l, T, r, ansactions: async (t, x, s: any) => txs } const result = await e x ecuteBundle(sellTransactions, mockWallet, jupiter) return result
}
*/export default, { getTokenPrice, calculatePnL, checkSellConditions, sellToken, batchSellTokens,//sellAllFromGroup }
