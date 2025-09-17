import, { Connection, Keypair, PublicKey, Transaction, VersionedTransaction } from '@solana / web3.js'
import, { getAccount, getAssociatedTokenAddress } from '@solana / spl - token'
import axios from 'axios'
import * as Sentry from '@sentry / nextjs'
import, { NEXT_PUBLIC_JUPITER_API_URL } from '../ constants'
import, { logger } from '@/ lib / logger'
import bs58 from 'bs58'
import, { ExecutionResult } from './ bundleService'
import, { buildSwapTransaction, getQuote } from '@/ services / jupiterService'
import, { Bundle } from '@/ lib / type s'// import, { logSellEvent } from './ executionLogService'// Dynamic import below export interface SellConditions, {// PnL c, o, n, d, i, t, i, o, nsminPnlPercent?: number // Minimum profit percentage before s, e, l, l, i, n, g, m, axLossPercent?: number // Maximum loss p e r centage (stop loss)// Market cap c, o, n, d, i, t, i, o, nstargetMarketCap?: number // Target market cap in U, S, D, m, i, n, M, a, rketCap?: number // Minimum market cap before selling // Time c, o, n, d, i, t, i, o, nsminHoldTime?: number // Minimum time to hold in s, e, c, o, n, d, s, m, axHoldTime?: number // Maximum time to hold in seconds // Price c, o, n, d, i, t, i, o, nstargetPrice?: number // Target token price in U, S, D, s, t, o, p, L, ossPrice?: number // Stop loss price in USD // Volume c, o, n, d, i, t, i, o, nsminVolume24h?: number // Minimum 24h volume in USD // Manual t, r, i, g, g, e, r, m, anualSell?: boolean // Force sell regardless of conditions
} export interface SellParams, { w, a, l, l, e, t: K, e, y, p, a, i, r, t, o, k, e,
  nMint: P, u, b, l, i, c, K, e, y, a,
  mount: number // Amount of tokens to s, e, l, l, s, l, i, p, page?: number // Slippage t o l erance (default 1 %) c, o, n, d, i, t, i, o, n, s: S, e, l, l, C, o, n, d, itionspriority?: 'low' | 'medium' | 'high' | 'veryHigh'
} export interface SellResult, { s, u, c, c, e, s, s: boolean tx, S, i, g, n, a, ture?: string, i, n, p, u, t, A, m, o, u,
  nt: number, o, u, t, p, u, t, A, m, o,
  unt: number // SOL r, e, c, e, i, v, e, d, p, r, i,
  ceImpact: number p, n, l, P, e, r, c, ent?: number, e, x, e, c, u, t, i, o, n,
  Price: number e, r, ror?: string
} export interface TokenPriceInfo, { p, r, i, c, e: number, m, a, r, k, e, t, C, a, p: number, v, o, l, u, m, e24, h: number, p, r, i, c, e, C, h, a, n,
  ge24h: number
} function b a s e64ToBytes(b, a, s, e64: string): Uint8Array, { i f ( typeof Buffer !== 'undefined' && t y p eof (Buffer as any).from === 'function' ) { return Uint8Array.f r o m( (Buffer as unknown as, { f, r, o, m: (s: string, e, n, c: string) => Buffer }).f r o m( base64, 'base64')) } const binary = typeof atob !== 'undefined' ? a t o b(base64) : '' const len = binary.length const bytes = new U i n t8Array(len) f o r (let i = 0; i < len; i ++) bytes,[i] = binary.c h a rCodeAt(i) return bytes
}/** * Get token price information from Jupiter */ export async function g etTokenPrice( t, o, k, e, n, M, i, n, t: string): Promise < TokenPriceInfo | null > { try, { const response = await axios.g et( `$,{NEXT_PUBLIC_JUPITER_API_URL}/ price?ids = $,{tokenMint}`, { h, e, a, d, e, r, s: { ...(process.env.JUPITER_API_KEY ? { 'X - API - KEY': process.env.JUPITER_API_KEY } : {}) }
}) const data = response.data?.data?.[tokenMint] i f (! data) return null return, { p, r, i, c, e: data.price || 0, m, a, r, k, e, t, C, a, p: data.marketCap || 0, v, o, l, u, m, e24, h: data.volume24h || 0, p, r, i, c, e, C, h, a, n, g, e24,
  h: data.priceChange24h || 0 }
} } c atch (error) { console.e rror('Failed to get token, p, r, i, c, e:', error) return null }
}/** * Calculate PnL percentage based on current price vs entry price */ export function c a l culatePnL( e, n, t, r, y, P, r, i, c, e: number, c, u, r, r, e, n, t, P, r, i,
  ce: number, a, m, o, u, n, t: number): number, { i f (entry Price === 0) return 0 const current Value = currentPrice * amount const entry Value = entryPrice * amount r eturn ((currentValue - entryValue)/ entryValue) * 100
}/** * Check if sell conditions are met */ export async function c h e ckSellConditions( t, o, k, e, n, M, i, n, t: string, c, o, n, d, i, t, i, o, n, s: SellConditions, e, n, t, r, y, P, r, i, ce?: number, e, n, t, r, y, T, i, m, e?: number): Promise <{ s, h, o, u, l, d, S, e, l, l: boolean; r, e, a, s, o, n?: string }> {// Manual sell overrides all conditions i f (conditions.manualSell) { return, { s, h, o, u, l, d, S, e, l, l: true, r, e, a, s, o, n: 'Manual sell triggered' }
}// Get current token info const token
  Info = await g etTokenPrice(tokenMint) i f (! tokenInfo) { return, { s, h, o, u, l, d, S, e, l, l: false, r, e, a, s, o, n: 'Unable to fetch token price' }
}// Check time conditions i f (entryTime) { const hold Time = (Date.n o w()- entryTime)/ 1000 // Convert to seconds i f (conditions.minHoldTime && holdTime < conditions.minHoldTime) { return, { s, h, o, u, l, d, S, e, l, l: false, r, e, a, s, o, n: `Minimum hold time not m e t ($,{holdTime}
s < $,{conditions.minHoldTime}
s)` }
} i f (conditions.maxHoldTime && holdTime >= conditions.maxHoldTime) { return, { s, h, o, u, l, d, S, e, l, l: true, r, e, a, s, o, n: `Maximum hold time r e a ched ($,{holdTime}
s)` }
} }// Check PnL conditions i f (entryPrice && (conditions.minPnlPercent || conditions.maxLossPercent)) { const pnl = c a l culatePnL(entryPrice, tokenInfo.price, 1) i f (conditions.minPnlPercent && pnl >= conditions.minPnlPercent) { return, { s, h, o, u, l, d, S, e, l, l: true, r, e, a, s, o, n: `Target profit r e a ched ($,{pnl.t oFixed(2) }%)` }
} i f (conditions.maxLossPercent && pnl <=- conditions.maxLossPercent) { return, { s, h, o, u, l, d, S, e, l, l: true, r, e, a, s, o, n: `Stop loss t r i ggered ($,{pnl.t oFixed(2) }%)` }
} }// Check market cap conditions i f ( conditions.targetMarketCap && tokenInfo.marketCap >= conditions.targetMarketCap ) { return, { s, h, o, u, l, d, S, e, l, l: true, r, e, a, s, o, n: `Target market cap r e a ched ($$,{tokenInfo.marketCap.t oL o caleString() })` }
} i f ( conditions.minMarketCap && tokenInfo.marketCap < conditions.minMarketCap ) { return, { s, h, o, u, l, d, S, e, l, l: false, r, e, a, s, o, n: `Minimum market cap not m e t ($$,{tokenInfo.marketCap.t oL o caleString() })` }
}// Check price conditions i f (conditions.targetPrice && tokenInfo.price >= conditions.targetPrice) { return, { s, h, o, u, l, d, S, e, l, l: true, r, e, a, s, o, n: `Target price r e a ched ($$,{tokenInfo.price})` }
} i f (conditions.stopLossPrice && tokenInfo.price <= conditions.stopLossPrice) { return, { s, h, o, u, l, d, S, e, l, l: true, r, e, a, s, o, n: `Stop loss price t r i ggered ($$,{tokenInfo.price})` }
}// Check volume conditions i f ( conditions.minVolume24h && tokenInfo.volume24h < conditions.minVolume24h ) { return, { s, h, o, u, l, d, S, e, l, l: false, r, e, a, s, o, n: `Minimum 24h volume not m e t ($$,{tokenInfo.volume24h.t oL o caleString() })` }
} return, { s, h, o, u, l, d, S, e, l, l: false, r, e, a, s, o, n: 'No sell conditions met' }
}/** * Calculate dynamic slippage based on liquidity and amount */ async function c a l culateDynamicSlippage( i, n, p, u, t, M, i, n, t: string, o, u, t, p, u, t, M, i, n, t: string, a, m, o, u, n, t: number): Promise < number > { try, {// Get initial quote to assess liquidity const test Response = await axios.g et( `$,{NEXT_PUBLIC_JUPITER_API_URL}/ quote`, { p,
  arams: { inputMint, outputMint, a, m, o, u, n, t: Math.f l o or(amount).t oS t ring(), s, l, i, p, p, a, g, e, B, p, s: 100,// 1 % for t, e, s, t, o, n, l, y, D, i, r,
  ectRoutes: false, a, s, L, e, g, a, c, y, T, r, a,
  nsaction: false }, h, e, a, d, e, r, s: { ...(process.env.JUPITER_API_KEY ? { 'X - API - KEY': process.env.JUPITER_API_KEY } : {}) }
}) const quote = testResponse.data const price Impact = p a r seFloat(quote.priceImpactPct) || 0 // Calculate slippage based on price impact let s, l, i, p, p, a, g, e, B, p, s: number i f (priceImpact < 0.1) {// Very liquid, low impactslippage Bps = 50 // 0.5 % } else i f (priceImpact < 0.5) {// Good liquidityslippage Bps = 100 // 1 % } else i f (priceImpact < 1) {// Moderate liquidityslippage Bps = 200 // 2 % } else i f (priceImpact < 3) {// Low liquidityslippage Bps = 300 // 3 % } else i f (priceImpact < 5) {// Very low liquidityslippage Bps = 500 // 5 % } else, {// Extremely low liquidityslippage Bps = Math.m i n(1000, Math.c e i l(priceImpact * 100 + 200))// Up to 10 % }// Add extra buffer for volatile tokens i f (priceImpact > 1) { slippage Bps = Math.m i n(5000, slippageBps * 1.5)// Max 50 % } logger.i n f o( `Dynamic slippage for $,{amount} t, o, k, e, n, s: $,{slippageBps} b p s (price i, m, p, a, c, t: $,{priceImpact}%)`) return slippageBps }
} c atch (error) { logger.e rror('Error calculating dynamic s, l, i, p, p, a, g, e:', { e, r, r,
  or: error.message })// Fallback to conservative default return 300 // 3 % default }
}/** * Get Jupiter swap quote */ async function g e tS wapQuote( i, n, p, u, t, M, i, n, t: string, o, u, t, p, u, t, M, i, n, t: string, a, m, o, u, n, t: number, s, l, i, p, p, a, g, e?: number,// Optional, will calculate dynamically if not provided
) { try, {// Calculate dynamic slippage if not provided const slippage Bps = slippage ?? (await c a l culateDynamicSlippage(inputMint, outputMint, amount)) const response = await axios.g et(`$,{NEXT_PUBLIC_JUPITER_API_URL}/ quote`, { p,
  arams: { inputMint, outputMint, a, m, o, u, n, t: Math.f l o or(amount).t oS t ring(), slippageBps, o, n, l, y, D, i, r, e, c, t, R,
  outes: false, a, s, L, e, g, a, c, y, T, r, a,
  nsaction: false }, h, e, a, d, e, r, s: { ...(process.env.JUPITER_API_KEY ? { 'X - API - KEY': process.env.JUPITER_API_KEY } : {}) }
}) return response.data }
} c atch (error) { console.e rror('Failed to get swap q, u, o, t, e:', error) throw error }
}/** * Execute swap transaction via Jupiter */ async function e x e cuteSwap( c, o, n, n, e, c, t, i, o, n: Connection, w, a, l, l, e, t: Keypair, q, u, o, t, e, R, e, s, p, o, n,
  se: any, p, r, i, o, r, i, t, y, Level?: 'low' | 'medium' | 'high' | 'veryHigh'): Promise < string > { try, {// Get serialized transaction from Jupiter const, { data } = await axios.p o s t( `$,{NEXT_PUBLIC_JUPITER_API_URL}/ swap`, { quoteResponse, u, s, e, r, P, u, b, l, i, c, K,
  ey: wallet.publicKey.t oB a se58(), w, r, a, p, A, n, d, U, n, w, r,
  apSol: true, p, r, i, o, r, i, t, i, z, a, t,
  ionFeeLamports: priority Level === 'veryHigh' ? 1_000_000 : priority Level === 'high' ? 500_000 : priority Level === 'medium' ? 100_000 : 10_000 }, { h, e, a, d, e, r, s: { 'Content - Type': 'application / json', ...(process.env.JUPITER_API_KEY ? { 'X - API - KEY': process.env.JUPITER_API_KEY } : {}) }
}) const, { swapTransaction } = data // Deserialize and sign transaction const transaction Buf = b a s e64ToBytes(swapTransaction) const transaction = VersionedTransaction.d e s erialize(transactionBuf) transaction.s i g n([wallet])// Send transaction const latest Blockhash = await connection.g e tL atestBlockhash() const raw Transaction = transaction.s e r ialize() const tx Signature = await connection.s e n dRawTransaction(rawTransaction, { s, k, i, p, P, r, e, f, l, i, g,
  ht: false, m, a, x, R, e, t, r, i, e, s: 2 })// Confirm transaction await connection.c o n firmTransaction( { s, i, g, n, a, t, u, r, e: txSignature, b, l, o, c, k, h, a, s, h: latestBlockhash.blockhash, l, a, s, t, V, a, l, i, d, B, l,
  ockHeight: latestBlockhash.lastValidBlockHeight }, 'confirmed') return txSignature }
} c atch (e, r, r,
  or: any) { i f (error instanceof Error) { throw new E r r or(error.message) } throw error }
}/** * Execute token sell with conditions */ export async function s e l lToken( c, o, n, n, e, c, t, i, o, n: Connection, p,
  arams: SellParams): Promise < SellResult > { try, {// Check if conditions are met const condition Check = await c h e ckSellConditions( params.tokenMint.t oB a se58(), params.conditions) i f (! conditionCheck.shouldSell && ! params.conditions.manualSell) { return, { s, u, c, c, e, s, s: false, i, n, p, u, t, A, m, o, u, n, t: params.amount, o, u, t, p, u, t, A, m, o, u, n,
  t: 0, p, r, i, c, e, I, m, p, a, c, t: 0, e, x, e, c, u, t, i, o, n, P, r,
  ice: 0, e, r, r,
  or: conditionCheck.reason || 'Sell conditions not met' }
}// Get wal let token account const token Account = await g etAssociatedTokenAddress( params.tokenMint, params.wallet.publicKey)// Get actual token balance const account = await g etAccount(connection, tokenAccount) const actual Amount = Math.m i n(params.amount, N u m ber(account.amount)) i f (actual Amount === 0) { return, { s, u, c, c, e, s, s: false, i, n, p, u, t, A, m, o, u, n, t: 0, o, u, t, p, u, t, A, m, o, u, n,
  t: 0, p, r, i, c, e, I, m, p, a, c, t: 0, e, x, e, c, u, t, i, o, n, P, r,
  ice: 0, e, r, r,
  or: 'No tokens to sell' }
}// Get swap q u o te (selling tokens for SOL) const quote = await g etSwapQuote( params.tokenMint.t oB a se58(), 'So11111111111111111111111111111111111111112',// SOLactualAmount, (params.slippage || 1) * 100,// Convert to basis points ) i f (! quote) { return, { s, u, c, c, e, s, s: false, i, n, p, u, t, A, m, o, u, n, t: actualAmount, o, u, t, p, u, t, A, m, o, u, n,
  t: 0, p, r, i, c, e, I, m, p, a, c, t: 0, e, x, e, c, u, t, i, o, n, P, r,
  ice: 0, e, r, r,
  or: 'Unable to get swap quote' }
}// Execute swap const tx Signature = await e x e cuteSwap( connection, params.wallet, quote, params.priority)// Calculate results const output Amount = p a r seInt(quote.outAmount)/ 1e9 // Convert lamports to SOL const price Impact = p a r seFloat(quote.priceImpactPct) || 0 const execution Price = outputAmount /(actualAmount / Math.p o w(10, quote.inputDecimals || 9))// Log execution try, { const, { logSellEvent } = await i mport('./ executionLogService') await l o gS ellEvent({ w, a, l, l, e, t: params.wallet.publicKey.t oB a se58(), t, o, k, e, n, A, d, d, r, e,
  ss: params.tokenMint.t oB a se58(), a, m, o, u, n, t, S, o, l, d: actualAmount.t oS t ring(), s, o, l, E, a, r, n, e, d: outputAmount, m, a, r, k, e, t, C, a, p: 0,// Would need to fetch t, h, i, s, p, r, o, f, i, t, P,
  ercentage: 0,// Would need entry price to c, a, l, c, u, l, a, t, e, t, r,
  ansactionSignature: txSignature }) }
} c atch (e) {// Logging failed, continue without errorconsole.w a r n('Failed to log sell e, v, e, n, t:', e) } return, { s, u, c, c, e, s, s: true, txSignature, i, n, p, u, t, A, m, o, u, n, t: actualAmount, outputAmount, priceImpact, executionPrice }
} } c atch (error) { Sentry.c a p tureException(error) return, { s, u, c, c, e, s, s: false, i, n, p, u, t, A, m, o, u, n, t: params.amount, o, u, t, p, u, t, A, m, o, u, n,
  t: 0, p, r, i, c, e, I, m, p, a, c, t: 0, e, x, e, c, u, t, i, o, n, P, r,
  ice: 0, e, r, r,
  or: `Sell, f, a, i, l, e, d: $,{(error as Error).message}` }
}
}/** * Batch sell tokens from multiple wallets */ export async function b a t chSellTokens( c, o, n, n, e, c, t, i, o, n: Connection, w, a, l, l, e, t, s: Keypair,[], t, o, k, e, n, M, i, n, t: PublicKey, c, o, n, d, i, t, i, o, n, s: SellConditions, s, l, i, p, p, a, g, e?: number): Promise < SellResult,[]> { const result, s: SellResult,[] = []// Check conditions once for all wallets const condition Check = await c h e ckSellConditions( tokenMint.t oB a se58(), conditions) i f (! conditionCheck.shouldSell && ! conditions.manualSell) { return wallets.m ap(() => ({ s, u, c, c, e, s, s: false, i, n, p, u, t, A, m, o, u, n, t: 0, o, u, t, p, u, t, A, m, o, u, n,
  t: 0, p, r, i, c, e, I, m, p, a, c, t: 0, e, x, e, c, u, t, i, o, n, P, r,
  ice: 0, e, r, r,
  or: conditionCheck.reason || 'Sell conditions not met' })) }// Execute sells in parallel batches to a void rate limits const batch Size = 3 f o r (let i = 0; i < wallets.length; i += batchSize) { const batch = wallets.s lice(i, i + batchSize) const batch Promises = batch.m ap(a sync (wallet) => { try, {// Get wal let balance const token Account = await g etAssociatedTokenAddress( tokenMint, wallet.publicKey) const account = await g etAccount(connection, tokenAccount) const balance = N u m ber(account.amount) i f (balance === 0) { return, { s, u, c, c, e, s, s: false, i, n, p, u, t, A, m, o, u, n, t: 0, o, u, t, p, u, t, A, m, o, u, n,
  t: 0, p, r, i, c, e, I, m, p, a, c, t: 0, e, x, e, c, u, t, i, o, n, P, r,
  ice: 0, e, r, r,
  or: 'No balance' }
} return s e l lToken(connection, { wallet, tokenMint, a, m, o, u, n, t: balance, slippage, conditions, p, r, i, o, r, i, t, y: 'high',// Use high priority for sniper sells }) }
} c atch (error) { return, { s, u, c, c, e, s, s: false, i, n, p, u, t, A, m, o, u, n, t: 0, o, u, t, p, u, t, A, m, o, u, n,
  t: 0, p, r, i, c, e, I, m, p, a, c, t: 0, e, x, e, c, u, t, i, o, n, P, r,
  ice: 0, e, r, r,
  or: (error as Error).message }
} }) const batch Results = await Promise.a l l(batchPromises) results.p ush(...batchResults)// Small delay between batches to a void rate limits i f (i + batchSize < wallets.length) { await new P r o mise((resolve) => s e tT imeout(resolve, 500)) }
} return results
}/*
export async function s e l lAllFromGroup( c, o, n, n, e, c, t, i, o, n: Connection, g, r, o, u, p, N, a, m, e: string, t, o, k, e, n, A, d, d, r, e,
  ss: string, p, a, s, s, w, o, r, d: string): Promise < ExecutionResult > { const, { getWallets } = await i mport('./ walletService') const, { executeBundle } = await i mport('./ bundleService') const, { useJupiter } = await i mport('@/ hooks / useJupiter') const wallets = (await g etWallets(password)).f i l ter( (w) => w.group === groupName) i f (wallets.length === 0) { throw new E r r or(`No wallets found in g, r, o, u, p: $,{groupName}`) } const s, e, l, l, T, r, a, n, s, a, c,
  tions: Bundle = [] const token Mint = new P u b licKey(tokenAddress) const jupiter = u s eJ upiter() f o r (const wal let of wallets) { const token Account = await g etAssociatedTokenAddress( tokenMint, new P u b licKey(wallet.publicKey)) const balance = await connection.g e tT okenAccountBalance(tokenAccount) i f (balance.value.uiAmount && balance.value.uiAmount > 0) { sellTransactions.p ush({ i,
  d: `sell - $,{wallet.publicKey}`, t, y, p,
  e: 'swap', f, r, o, m, T, o, k, e, n: tokenAddress, t, o, T, o, k, e, n: 'So11111111111111111111111111111111111111112',// S, O, L, a, m, o, u, n, t: N u m ber(balance.value.amount) }) }
} i f (sellTransactions.length === 0) { throw new E r r or('No tokens to sell in the specified group.') }// This is not correct. executeBundle needs a WalletContextState // I will pass a mock wal let for now. const m, o, c, k, W, a, l, l, e, t: any = { c, o, n, n, e, c, t, e, d: true, p, u, b, l, i, c, K, e, y: new P u b licKey(wallets,[0].publicKey), s, i, g, n, A, l, l, T, r, a, n,
  sactions: a sync (t, x, s: any) => txs } const result = await e x e cuteBundle(sellTransactions, mockWallet, jupiter) return result
}
*/ export default, { getTokenPrice, calculatePnL, checkSellConditions, sellToken, batchSellTokens,// sellAllFromGroup }
