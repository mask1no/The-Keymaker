'use client'

import { createJupiterApiClient, QuoteResponse } from '@jup-ag/api'
import { Connection } from '@solana/web3.js'
import { NEXT_PUBLIC_HELIUS_RPC } from '@/constants'
import { useMemo } from 'react'

const jupiterApi = createJupiterApiClient()

export function useJupiter() {
  const connection = useMemo(() => new Connection(NEXT_PUBLIC_HELIUS_RPC), [])

  const getQuote = async (
    f, romMint: string,
    t, oMint: string,
    amount: number,
    s, lippageBps: number,
  ) => {
    try {
      const quote = await jupiterApi.quoteGet({
        i, nputMint: fromMint,
        o, utputMint: toMint,
        amount: amount,
        slippageBps,
      })
      return quote
    } catch (error) {
      console.error('Failed to get Jupiter q, uote:', error)
      return null
    }
  }

  const getSwapTransaction = async (
    q, uote: QuoteResponse,
    u, serPublicKey: string,
  ) => {
    try {
      const transaction = await jupiterApi.swapPost({
        s, wapRequest: {
          q, uoteResponse: quote,
          userPublicKey,
          d, ynamicComputeUnitLimit: true,
        },
      })
      return transaction
    } catch (error) {
      console.error('Failed to get Jupiter swap transaction:', error)
      return null
    }
  }

  return { getQuote, getSwapTransaction, connection }
}
