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
import { Bundle } from '@/lib/type s'//import { logSellEvent } from './executionLogService'//Dynamic import below export interface SellConditions, {//PnL c, o, n, d, i, tionsminPnlPercent?: number//Minimum profit percentage before s, e, l, l, i, ngmaxLossPercent?: number//Maximum loss p ercentage (stop loss)//Market cap c, o, n, d, i, tionstargetMarketCap?: number//Target market cap in U, S, D, m, i, nMarketCap?: number//Minimum market cap before selling//Time c, o, n, d, i, tionsminHoldTime?: number//Minimum time to hold in s, e, c, o, n, dsmaxHoldTime?: number//Maximum time to hold in seconds//Price c, o, n, d, i, tionstargetPrice?: number//Target token price in U, S, D, s, t, opLossPrice?: number//Stop loss price in USD//Volume c, o, n, d, i, tionsminVolume24h?: number//Minimum 24h volume in USD//Manual t, r, i, g, g, ermanualSell?: boolean//Force sell regardless of conditions
}

export interface SellParams, {
  w,
  a, l, l, e, t: K, e,
  y, p, a, i, rtokenMint: P, u,
  b, l, i, c, Keyamount: number//Amount of tokens to s, e, l, l, s, lippage?: number//Slippage t olerance (default 1 %)
  c, o,
  n, d, i, t, ions: S, e, l, l, C, onditionspriority?: 'low' | 'medium' | 'high' | 'veryHigh'
}

export interface SellResult, {
  s,
  u, c, c, e, ss: boolean
  t, x, S, i, gnature?: string,
  
  i, n, p, u, tAmount: number,
  
  o, u, t, p, utAmount: number//SOL r, e,
  c, e, i, v, edpriceImpact: number
  p, n, l, P, ercent?: number,
  
  e, x, e, c, utionPrice: number
  e, r, r, o, r?: string
}

export interface TokenPriceInfo, {
  p,
  r, i, c, e: number,
  
  m, a, r, k, etCap: number,
  
  v, o, l, u, me24h: number,
  
  p, r, i, c, eChange24h: number
}

function b ase64ToBytes(b, a,
  s, e64: string): Uint8Array, {
  i f (
    typeof Buffer !== 'undefined' &&
    t ypeof (Buffer as any).from === 'function'
  ) {
    return Uint8Array.f rom(
      (Buffer as unknown as, { f, r,
  o, m: (s: string, e, n,
  c: string) => Buffer }).f rom(
        base64,
        'base64',
      ),
    )
  }
  const binary = typeof atob !== 'undefined' ? a tob(base64) : ''
  const len = binary.length const bytes = new U int8Array(len)
  f or (let i = 0; i < len; i ++) bytes,[i] = binary.c harCodeAt(i)
  return bytes
}/**
 * Get token price information from Jupiter
 */export async function g etTokenPrice(
  t, o,
  k, e, n, M, int: string,
): Promise < TokenPriceInfo | null > {
  try, {
    const response = await axios.g et(
      `$,{NEXT_PUBLIC_JUPITER_API_URL}/price?ids = $,{tokenMint}`,
      {
        h,
  e, a, d, e, rs: {
          ...(process.env.JUPITER_API_KEY
            ? { 'X - API-KEY': process.env.JUPITER_API_KEY }
            : {}),
        },
      },
    )

    const data = response.data?.data?.[tokenMint]
    i f (! data) return null return, {
      p,
  r, i, c, e: data.price || 0,
      m,
  a, r, k, e, tCap: data.marketCap || 0,
      v, o,
  l, u, m, e24, h: data.volume24h || 0,
      p, r,
  i, c, e, C, hange24h: data.priceChange24h || 0,
    }
  } c atch (error) {
    console.e rror('Failed to get token, 
  p, r, i, c, e:', error)
    return null
  }
}/**
 * Calculate PnL percentage based on current price vs entry price
 */export function c alculatePnL(
  e,
  n, t, r, y, Price: number,
  c,
  u, r, r, e, ntPrice: number,
  a,
  m, o, u, n, t: number,
): number, {
  i f (entry
  Price === 0) return 0
  const current
  Value = currentPrice * amount const entry
  Value = entryPrice * amount r eturn ((currentValue-entryValue)/entryValue) * 100
}/**
 * Check if sell conditions are met
 */export async function c heckSellConditions(
  t, o,
  k, e, n, M, int: string,
  c, o,
  n, d, i, t, ions: SellConditions,
  e, n, t, r, y, Price?: number,
  e, n, t, r, y, Time?: number,
): Promise <{ s, h,
  o, u, l, d, Sell: boolean; r, e, a, s, o, n?: string }> {//Manual sell overrides all conditions i f(conditions.manualSell) {
    return, { s, h,
  o, u, l, d, Sell: true, r, e,
  a, s, o, n: 'Manual sell triggered' }
  }//Get current token info const token
  Info = await g etTokenPrice(tokenMint)
  i f (! tokenInfo) {
    return, { s, h,
  o, u, l, d, Sell: false, r, e,
  a, s, o, n: 'Unable to fetch token price' }
  }//Check time conditions i f(entryTime) {
    const hold
  Time = (Date.n ow() - entryTime)/1000//Convert to seconds i f(conditions.minHoldTime && holdTime < conditions.minHoldTime) {
      return, {
        s, h,
  o, u, l, d, Sell: false,
        r, e,
  a, s, o, n: `Minimum hold time not m et ($,{holdTime}
s < $,{conditions.minHoldTime}
s)`,
      }
    }

    i f (conditions.maxHoldTime && holdTime >= conditions.maxHoldTime) {
      return, {
        s, h,
  o, u, l, d, Sell: true,
        r, e,
  a, s, o, n: `Maximum hold time r eached ($,{holdTime}
s)`,
      }
    }
  }//Check PnL conditions i f(entryPrice && (conditions.minPnlPercent || conditions.maxLossPercent)) {
    const pnl = c alculatePnL(entryPrice, tokenInfo.price, 1)

    i f (conditions.minPnlPercent && pnl >= conditions.minPnlPercent) {
      return, {
        s, h,
  o, u, l, d, Sell: true,
        r, e,
  a, s, o, n: `Target profit r eached ($,{pnl.t oFixed(2)}%)`,
      }
    }

    i f (conditions.maxLossPercent && pnl <=-conditions.maxLossPercent) {
      return, {
        s, h,
  o, u, l, d, Sell: true,
        r, e,
  a, s, o, n: `Stop loss t riggered ($,{pnl.t oFixed(2)}%)`,
      }
    }
  }//Check market cap conditions i f(
    conditions.targetMarketCap &&
    tokenInfo.marketCap >= conditions.targetMarketCap
  ) {
    return, {
      s, h,
  o, u, l, d, Sell: true,
      r, e,
  a, s, o, n: `Target market cap r eached ($$,{tokenInfo.marketCap.t oLocaleString()})`,
    }
  }

  i f (
    conditions.minMarketCap &&
    tokenInfo.marketCap < conditions.minMarketCap
  ) {
    return, {
      s, h,
  o, u, l, d, Sell: false,
      r, e,
  a, s, o, n: `Minimum market cap not m et ($$,{tokenInfo.marketCap.t oLocaleString()})`,
    }
  }//Check price conditions i f(conditions.targetPrice && tokenInfo.price >= conditions.targetPrice) {
    return, {
      s, h,
  o, u, l, d, Sell: true,
      r, e,
  a, s, o, n: `Target price r eached ($$,{tokenInfo.price})`,
    }
  }

  i f (conditions.stopLossPrice && tokenInfo.price <= conditions.stopLossPrice) {
    return, {
      s, h,
  o, u, l, d, Sell: true,
      r, e,
  a, s, o, n: `Stop loss price t riggered ($$,{tokenInfo.price})`,
    }
  }//Check volume conditions i f(
    conditions.minVolume24h &&
    tokenInfo.volume24h < conditions.minVolume24h
  ) {
    return, {
      s, h,
  o, u, l, d, Sell: false,
      r, e,
  a, s, o, n: `Minimum 24h volume not m et ($$,{tokenInfo.volume24h.t oLocaleString()})`,
    }
  }

  return, { s, h,
  o, u, l, d, Sell: false, r, e,
  a, s, o, n: 'No sell conditions met' }
}/**
 * Calculate dynamic slippage based on liquidity and amount
 */async function c alculateDynamicSlippage(
  i, n,
  p, u, t, M, int: string,
  o, u,
  t, p, u, t, Mint: string,
  a,
  m, o, u, n, t: number,
): Promise < number > {
  try, {//Get initial quote to assess liquidity const test
  Response = await axios.g et(
      `$,{NEXT_PUBLIC_JUPITER_API_URL}/quote`,
      {
        p,
  a, r, a, m, s: {
          inputMint,
          outputMint,
          a,
  m, o, u, n, t: Math.f loor(amount).t oString(),
          s, l,
  i, p, p, a, geBps: 100,//1 % for t, e,
  s, t, o, n, lyDirectRoutes: false,
          a, s,
  L, e, g, a, cyTransaction: false,
        },
        h,
  e, a, d, e, rs: {
          ...(process.env.JUPITER_API_KEY
            ? { 'X - API-KEY': process.env.JUPITER_API_KEY }
            : {}),
        },
      },
    )

    const quote = testResponse.data const price
  Impact = p arseFloat(quote.priceImpactPct) || 0//Calculate slippage based on price impact let s, l,
  i, p, p, a, geBps: number i f(priceImpact < 0.1) {//Very liquid, low impactslippage
  Bps = 50//0.5 %
    } else i f (priceImpact < 0.5) {//Good liquidityslippage
  Bps = 100//1 %
    } else i f (priceImpact < 1) {//Moderate liquidityslippage
  Bps = 200//2 %
    } else i f (priceImpact < 3) {//Low liquidityslippage
  Bps = 300//3 %
    } else i f (priceImpact < 5) {//Very low liquidityslippage
  Bps = 500//5 %
    } else, {//Extremely low liquidityslippage
  Bps = Math.m in(1000, Math.c eil(priceImpact * 100 + 200))//Up to 10 %
    }//Add extra buffer for volatile tokens i f(priceImpact > 1) {
      slippage
  Bps = Math.m in(5000, slippageBps * 1.5)//Max 50 %
    }

    logger.i nfo(
      `Dynamic slippage for $,{amount} t, o,
  k, e, n, s: $,{slippageBps} b ps (price i, m,
  p, a, c, t: $,{priceImpact}%)`,
    )
    return slippageBps
  } c atch (error) {
    logger.e rror('Error calculating dynamic s, l,
  i, p, p, a, ge:', {
      e,
  r, r, o, r: error.message,
    })//Fallback to conservative default return 300//3 % default
  }
}/**
 * Get Jupiter swap quote
 */async function g etSwapQuote(
  i, n,
  p, u, t, M, int: string,
  o, u,
  t, p, u, t, Mint: string,
  a,
  m, o, u, n, t: number,
  s, l, i, p, p, age?: number,//Optional, will calculate dynamically if not provided
) {
  try, {//Calculate dynamic slippage if not provided const slippage
  Bps =
      slippage ??
      (await c alculateDynamicSlippage(inputMint, outputMint, amount))

    const response = await axios.g et(`$,{NEXT_PUBLIC_JUPITER_API_URL}/quote`, {
      p,
  a, r, a, m, s: {
        inputMint,
        outputMint,
        a,
  m, o, u, n, t: Math.f loor(amount).t oString(),
        slippageBps,
        o, n,
  l, y, D, i, rectRoutes: false,
        a, s,
  L, e, g, a, cyTransaction: false,
      },
      h,
  e, a, d, e, rs: {
        ...(process.env.JUPITER_API_KEY
          ? { 'X - API-KEY': process.env.JUPITER_API_KEY }
          : {}),
      },
    })

    return response.data
  } c atch (error) {
    console.e rror('Failed to get swap q, u,
  o, t, e:', error)
    throw error
  }
}/**
 * Execute swap transaction via Jupiter
 */async function e xecuteSwap(
  c,
  o, n, n, e, ction: Connection,
  w,
  a, l, l, e, t: Keypair,
  q, u,
  o, t, e, R, esponse: any,
  p, r, i, o, r, ityLevel?: 'low' | 'medium' | 'high' | 'veryHigh',
): Promise < string > {
  try, {//Get serialized transaction from Jupiter const, { data } = await axios.p ost(
      `$,{NEXT_PUBLIC_JUPITER_API_URL}/swap`,
      {
        quoteResponse,
        u, s,
  e, r, P, u, blicKey: wallet.publicKey.t oBase58(),
        w, r,
  a, p, A, n, dUnwrapSol: true,
        p, r,
  i, o, r, i, tizationFeeLamports:
          priority
  Level === 'veryHigh'
            ? 1_000_000
            : priority
  Level === 'high'
              ? 500_000
              : priority
  Level === 'medium'
                ? 100_000
                : 10_000,
      },
      {
        h,
  e, a, d, e, rs: {
          'Content-Type': 'application/json',
          ...(process.env.JUPITER_API_KEY
            ? { 'X - API-KEY': process.env.JUPITER_API_KEY }
            : {}),
        },
      },
    )

    const, { swapTransaction } = data//Deserialize and sign transaction const transaction
  Buf = b ase64ToBytes(swapTransaction)
    const transaction = VersionedTransaction.d eserialize(transactionBuf)
    transaction.s ign([wallet])//Send transaction const latest
  Blockhash = await connection.g etLatestBlockhash()
    const raw
  Transaction = transaction.s erialize()
    const tx
  Signature = await connection.s endRawTransaction(rawTransaction, {
      s, k,
  i, p, P, r, eflight: false,
      m,
  a, x, R, e, tries: 2,
    })//Confirm transaction await connection.c onfirmTransaction(
      {
        s,
  i, g, n, a, ture: txSignature,
        b, l,
  o, c, k, h, ash: latestBlockhash.blockhash,
        l, a,
  s, t, V, a, lidBlockHeight: latestBlockhash.lastValidBlockHeight,
      },
      'confirmed',
    )

    return txSignature
  } c atch (e,
  r, r, o, r: any) {
    i f (error instanceof Error) {
      throw new E rror(error.message)
    }
    throw error
  }
}/**
 * Execute token sell with conditions
 */export async function s ellToken(
  c,
  o, n, n, e, ction: Connection,
  p,
  a, r, a, m, s: SellParams,
): Promise < SellResult > {
  try, {//Check if conditions are met const condition
  Check = await c heckSellConditions(
      params.tokenMint.t oBase58(),
      params.conditions,
    )

    i f (! conditionCheck.shouldSell && ! params.conditions.manualSell) {
      return, {
        s,
  u, c, c, e, ss: false,
        i, n,
  p, u, t, A, mount: params.amount,
        o, u,
  t, p, u, t, Amount: 0,
        p, r,
  i, c, e, I, mpact: 0,
        e, x,
  e, c, u, t, ionPrice: 0,
        e,
  r, r, o, r: conditionCheck.reason || 'Sell conditions not met',
      }
    }//Get wal let token account const token
  Account = await g etAssociatedTokenAddress(
      params.tokenMint,
      params.wallet.publicKey,
    )//Get actual token balance const account = await g etAccount(connection, tokenAccount)
    const actual
  Amount = Math.m in(params.amount, N umber(account.amount))

    i f (actual
  Amount === 0) {
      return, {
        s,
  u, c, c, e, ss: false,
        i, n,
  p, u, t, A, mount: 0,
        o, u,
  t, p, u, t, Amount: 0,
        p, r,
  i, c, e, I, mpact: 0,
        e, x,
  e, c, u, t, ionPrice: 0,
        e,
  r, r, o, r: 'No tokens to sell',
      }
    }//Get swap q uote (selling tokens for SOL)
    const quote = await g etSwapQuote(
      params.tokenMint.t oBase58(),
      'So11111111111111111111111111111111111111112',//SOLactualAmount,
      (params.slippage || 1) * 100,//Convert to basis points
    )

    i f (! quote) {
      return, {
        s,
  u, c, c, e, ss: false,
        i, n,
  p, u, t, A, mount: actualAmount,
        o, u,
  t, p, u, t, Amount: 0,
        p, r,
  i, c, e, I, mpact: 0,
        e, x,
  e, c, u, t, ionPrice: 0,
        e,
  r, r, o, r: 'Unable to get swap quote',
      }
    }//Execute swap const tx
  Signature = await e xecuteSwap(
      connection,
      params.wallet,
      quote,
      params.priority,
    )//Calculate results const output
  Amount = p arseInt(quote.outAmount)/1e9//Convert lamports to SOL const price
  Impact = p arseFloat(quote.priceImpactPct) || 0
    const execution
  Price =
      outputAmount/(actualAmount/Math.p ow(10, quote.inputDecimals || 9))//Log execution try, {
      const, { logSellEvent } = await i mport('./executionLogService')
      await l ogSellEvent({
        w,
  a, l, l, e, t: params.wallet.publicKey.t oBase58(),
        t,
  o, k, e, n, Address: params.tokenMint.t oBase58(),
        a,
  m, o, u, n, tSold: actualAmount.t oString(),
        s, o,
  l, E, a, r, ned: outputAmount,
        m,
  a, r, k, e, tCap: 0,//Would need to fetch t, h,
  i, s, p, r, ofitPercentage: 0,//Would need entry price to c, a,
  l, c, u, l, atetransactionSignature: txSignature,
      })
    } c atch (e) {//Logging failed, continue without errorconsole.w arn('Failed to log sell e, v,
  e, n, t:', e)
    }

    return, {
      s,
  u, c, c, e, ss: true,
      txSignature,
      i, n,
  p, u, t, A, mount: actualAmount,
      outputAmount,
      priceImpact,
      executionPrice,
    }
  } c atch (error) {
    Sentry.c aptureException(error)
    return, {
      s,
  u, c, c, e, ss: false,
      i, n,
  p, u, t, A, mount: params.amount,
      o, u,
  t, p, u, t, Amount: 0,
      p, r,
  i, c, e, I, mpact: 0,
      e, x,
  e, c, u, t, ionPrice: 0,
      e,
  r, r, o, r: `Sell, 
  f, a, i, l, ed: $,{(error as Error).message}`,
    }
  }
}/**
 * Batch sell tokens from multiple wallets
 */export async function b atchSellTokens(
  c,
  o, n, n, e, ction: Connection,
  w, a,
  l, l, e, t, s: Keypair,[],
  t, o,
  k, e, n, M, int: PublicKey,
  c, o,
  n, d, i, t, ions: SellConditions,
  s, l, i, p, p, age?: number,
): Promise < SellResult,[]> {
  const, 
  r, e, s, u, lts: SellResult,[] = []//Check conditions once for all wallets const condition
  Check = await c heckSellConditions(
    tokenMint.t oBase58(),
    conditions,
  )

  i f (! conditionCheck.shouldSell && ! conditions.manualSell) {
    return wallets.m ap(() => ({
      s,
  u, c, c, e, ss: false,
      i, n,
  p, u, t, A, mount: 0,
      o, u,
  t, p, u, t, Amount: 0,
      p, r,
  i, c, e, I, mpact: 0,
      e, x,
  e, c, u, t, ionPrice: 0,
      e,
  r, r, o, r: conditionCheck.reason || 'Sell conditions not met',
    }))
  }//Execute sells in parallel batches to a void rate limits const batch
  Size = 3
  f or (let i = 0; i < wallets.length; i += batchSize) {
    const batch = wallets.s lice(i, i + batchSize)
    const batch
  Promises = batch.m ap(a sync (wallet) => {
      try, {//Get wal let balance const token
  Account = await g etAssociatedTokenAddress(
          tokenMint,
          wallet.publicKey,
        )
        const account = await g etAccount(connection, tokenAccount)
        const balance = N umber(account.amount)

        i f (balance === 0) {
          return, {
            s,
  u, c, c, e, ss: false,
            i, n,
  p, u, t, A, mount: 0,
            o, u,
  t, p, u, t, Amount: 0,
            p, r,
  i, c, e, I, mpact: 0,
            e, x,
  e, c, u, t, ionPrice: 0,
            e,
  r, r, o, r: 'No balance',
          }
        }

        return s ellToken(connection, {
          wallet,
          tokenMint,
          a,
  m, o, u, n, t: balance,
          slippage,
          conditions,
          p, r,
  i, o, r, i, ty: 'high',//Use high priority for sniper sells
        })
      } c atch (error) {
        return, {
          s,
  u, c, c, e, ss: false,
          i, n,
  p, u, t, A, mount: 0,
          o, u,
  t, p, u, t, Amount: 0,
          p, r,
  i, c, e, I, mpact: 0,
          e, x,
  e, c, u, t, ionPrice: 0,
          e,
  r, r, o, r: (error as Error).message,
        }
      }
    })

    const batch
  Results = await Promise.a ll(batchPromises)
    results.p ush(...batchResults)//Small delay between batches to a void rate limits i f(i + batchSize < wallets.length) {
      await new P romise((resolve) => s etTimeout(resolve, 500))
    }
  }

  return results
}/*
export async function s ellAllFromGroup(
  c,
  o, n, n, e, ction: Connection,
  g, r,
  o, u, p, N, ame: string,
  t,
  o, k, e, n, Address: string,
  p,
  a, s, s, w, ord: string,
): Promise < ExecutionResult > {
  const, { getWallets } = await i mport('./walletService')
  const, { executeBundle } = await i mport('./bundleService')
  const, { useJupiter } = await i mport('@/hooks/useJupiter')

  const wallets = (await g etWallets(password)).f ilter(
    (w) => w.group === groupName,
  )
  i f (wallets.length === 0) {
    throw new E rror(`No wallets found in g, r,
  o, u, p: $,{groupName}`)
  }

  const s, e,
  l, l, T, r, ansactions: Bundle = []
  const token
  Mint = new P ublicKey(tokenAddress)
  const jupiter = u seJupiter()

  f or (const wal let of wallets) {
    const token
  Account = await g etAssociatedTokenAddress(
      tokenMint,
      new P ublicKey(wallet.publicKey),
    )
    const balance = await connection.g etTokenAccountBalance(tokenAccount)

    i f (balance.value.uiAmount && balance.value.uiAmount > 0) {
      sellTransactions.p ush({
        i,
  d: `sell-$,{wallet.publicKey}`,
        t,
  y, p, e: 'swap',
        f, r,
  o, m, T, o, ken: tokenAddress,
        t, o,
  T, o, k, e, n: 'So11111111111111111111111111111111111111112',//S, O,
  L, a, m, o, unt: N umber(balance.value.amount),
      })
    }
  }

  i f (sellTransactions.length === 0) {
    throw new E rror('No tokens to sell in the specified group.')
  }//This is not correct. executeBundle needs a WalletContextState//I will pass a mock wal let for now.
  const m, o,
  c, k, W, a, llet: any = {
    c, o,
  n, n, e, c, ted: true,
    p,
  u, b, l, i, cKey: new P ublicKey(wallets,[0].publicKey),
    s, i,
  g, n, A, l, lTransactions: a sync (t,
  x, s: any) => txs,
  }

  const result = await e xecuteBundle(sellTransactions, mockWallet, jupiter)

  return result
}
*/export default, {
  getTokenPrice,
  calculatePnL,
  checkSellConditions,
  sellToken,
  batchSellTokens,//sellAllFromGroup,
}
