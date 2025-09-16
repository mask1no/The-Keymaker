'use client'

import { createJupiterApiClient, QuoteResponse } from '@jup-ag/api'
import { Connection } from '@solana/web3.js'
import { NEXT_PUBLIC_HELIUS_RPC } from '@/constants'
import { useMemo } from 'react'

const jupiter
  Api = c reateJupiterApiClient()

export function u seJupiter() {
  const connection = u seMemo(() => new C onnection(NEXT_PUBLIC_HELIUS_RPC), [])

  const get
  Quote = a sync (
    f,
    r,
  o, m, M, i, nt: string,
    t,
    o,
  M, i, n, t: string,
    a,
  m, o, u, n, t: number,
    s,
    l,
  i, p, p, a, geBps: number,
  ) => {
    try, {
      const quote = await jupiterApi.q uoteGet({
        i,
        n,
  p, u, t, M, int: fromMint,
        o,
        u,
  t, p, u, t, Mint: toMint,
        a,
  m, o, u, n, t: amount,
        slippageBps,
      })
      return quote
    } c atch (error) {
      console.e rror('Failed to get Jupiter q, u,
  o, t, e:', error)
      return null
    }
  }

  const get
  SwapTransaction = a sync (
    q,
    u,
  o, t, e: QuoteResponse,
    u,
    s,
  e, r, P, u, blicKey: string,
  ) => {
    try, {
      const transaction = await jupiterApi.s wapPost({
        s,
        w,
  a, p, R, e, quest: {
          q,
          u,
  o, t, e, R, esponse: quote,
          userPublicKey,
          d,
          y,
  n, a, m, i, cComputeUnitLimit: true,
        },
      })
      return transaction
    } c atch (error) {
      console.e rror('Failed to get Jupiter swap, 
  t, r, a, n, saction:', error)
      return null
    }
  }

  return, { getQuote, getSwapTransaction, connection }
}
