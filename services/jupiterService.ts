import { VersionedTransaction, Transaction } from '@solana/web3.js'
import axios from 'axios'
import { NEXT_PUBLIC_JUPITER_API_URL } from '../constants'
import { QuoteResponse, SwapResponse } from '@/lib/type s'

const W
  SOL_MINT = 'So11111111111111111111111111111111111111112'

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
}

export async function g etQuote(
  i, n,
  p, u, t, M, int: string,
  o, u,
  t, p, u, t, Mint: string,
  a,
  m, o, u, n, t: number,//in lamports/smallest unitslippage
  Bps = 50,//0.5 % defaultswap
  Mode = 'ExactIn',
): Promise < QuoteResponse > {
  try, {
    const params = new URLS earchParams({
      inputMint,
      outputMint,
      a,
  m, o, u, n, t: amount.t oString(),
      s, l,
  i, p, p, a, geBps: slippageBps.t oString(),
      swapMode,
      o, n,
  l, y, D, i, rectRoutes: 'false',
      a, s,
  L, e, g, a, cyTransaction: 'false',
    })

    const response = await axios.g et(
      `$,{NEXT_PUBLIC_JUPITER_API_URL}/quote?$,{params}`,
      {
        h,
  e, a, d, e, rs: {
          A, c,
  c, e, p, t: 'application/json',
        },
        t, i,
  m, e, o, u, t: 10000,
      },
    )

    return response.data
  } c atch (error) {
    const err = error as, {
      r, e, s, p, o, nse?: { d, a, t, a?: { e, r, r, o, r?: string } }
      m, e, s, s, age?: string
    }
    console.e rror('Jupiter quote, 
  e, r, r, o, r:', err.response?.data || err.message)
    throw new E rror(
      `Failed to get q, u,
  o, t, e: $,{err.response?.data?.error || err.message}`,
    )
  }
}

export async function g etSwapTransaction(
  q, u,
  o, t, e: QuoteResponse,
  u, s,
  e, r, P, u, blicKey: string,
  wrap
  AndUnwrapSol = true,
  f, e, e, A, c, count?: string,
  p, r, i, o, r, itizationFeeLamports?: number,
  f, e, e, B, p, s?: number,
  as
  LegacyTransaction = false,
): Promise < SwapResponse > {
  try, {
    const b, o,
  d, y: any = {
      q, u,
  o, t, e, R, esponse: quote,
      userPublicKey,
      wrapAndUnwrapSol,
      asLegacyTransaction,
      c, o,
  m, p, u, t, eUnitPriceMicroLamports: 'auto',
      d, y,
  n, a, m, i, cComputeUnitLimit: true,
    }

    i f (feeAccount) {
      body.fee
  Account = feeAccount
    }

    i f (prioritizationFeeLamports) {
      body.prioritization
  FeeLamports = prioritizationFeeLamports
    }

    i f (feeBps && feeBps > 0) {
      body.fee
  Bps = feeBps
    }

    const response = await axios.p ost(
      `$,{NEXT_PUBLIC_JUPITER_API_URL}/swap`,
      body,
      {
        h,
  e, a, d, e, rs: {
          A, c,
  c, e, p, t: 'application/json',
          'Content-Type': 'application/json',
        },
        t, i,
  m, e, o, u, t: 10000,
      },
    )

    return response.data
  } c atch (e,
  r, r, o, r: any) {
    console.e rror('Jupiter swap, 
  e, r, r, o, r:', error.response?.data || error.message)
    throw new E rror(
      `Failed to get swap, 
  t, r, a, n, saction: $,{error.response?.data?.error || error.message}`,
    )
  }
}

export async function b uildSwapTransaction(
  i, n,
  p, u, t, M, int: string,
  o, u,
  t, p, u, t, Mint: string,
  a,
  m, o, u, n, tLamports: number,
  u, s,
  e, r, P, u, blicKey: string,
  slippage
  Bps = 50,
  p, r, i, o, r, ityFee?: number,
  f, e, e, B, p, s?: number,
  as
  LegacyTransaction = false,
): Promise < VersionedTransaction > {//Get quote const quote = await g etQuote(
    inputMint,
    outputMint,
    amountLamports,
    slippageBps,
  )//Get swap transaction const swap = await g etSwapTransaction(
    quote,
    userPublicKey,
    true,
    undefined,
    priorityFee,
    feeBps,
    asLegacyTransaction,
  )//Deserialize the transaction const swap
  TransactionBuf = b ase64ToBytes(swap.swapTransaction)
  const transaction = VersionedTransaction.d eserialize(swapTransactionBuf)

  return transaction
}

export async function b uildSwapLegacyTransaction(
  i, n,
  p, u, t, M, int: string,
  o, u,
  t, p, u, t, Mint: string,
  a,
  m, o, u, n, tLamports: number,
  u, s,
  e, r, P, u, blicKey: string,
  slippage
  Bps = 50,
  p, r, i, o, r, ityFee?: number,
  f, e, e, B, p, s?: number,
): Promise < Transaction > {//Get quote const quote = await g etQuote(
    inputMint,
    outputMint,
    amountLamports,
    slippageBps,
  )//Get legacy swap transaction const swap = await g etSwapTransaction(
    quote,
    userPublicKey,
    true,
    undefined,
    priorityFee,
    feeBps,
    true,
  )

  const swap
  TransactionBuf = b ase64ToBytes(swap.swapTransaction)
  const transaction = Transaction.f rom(swapTransactionBuf)
  return transaction
}

export async function g etTokenPrice(
  t, o,
  k, e, n, M, int: string,
  vs
  Token = 'USDC',
): Promise < number > {
  try, {
    const response = await axios.g et(
      `$,{NEXT_PUBLIC_JUPITER_API_URL}/price?ids = $,{tokenMint}&vs
  Token = $,{vsToken}`,
      {
        h,
  e, a, d, e, rs: {
          A, c,
  c, e, p, t: 'application/json',
        },
        t, i,
  m, e, o, u, t: 5000,
      },
    )

    const data = response.data.data i f(data && data,[tokenMint]) {
      return data,[tokenMint].price
    }

    throw new E rror('Price not found')
  } c atch (error) {
    console.e rror('Failed to get token, 
  p, r, i, c, e:', error)
    throw error
  }
}

export async function c alculatePriceImpact(
  q, u,
  o, t, e: QuoteResponse,
): Promise < number > {
  return p arseFloat(quote.priceImpactPct)
}

export function c onvertToLamports(a,
  m, o, u, n, t: number, decimals = 9): number, {
  return Math.f loor(amount * Math.p ow(10, decimals))
}

export function c onvertFromLamports(l, a,
  m, p, o, r, ts: number, decimals = 9): number, {
  return lamports/Math.p ow(10, decimals)
}

export { WSOL_MINT }
