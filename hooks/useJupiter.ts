'use client'

import { createJupiterApiClient, QuoteResponse } from '@jup-ag/api'
import { Connection } from '@solana/web3.js'
import { NEXT_PUBLIC_HELIUS_RPC } from '@/constants'
import { useMemo } from 'react'

const jupiterApi = createJupiterApiClient()

export function useJupiter() {
  const connection = useMemo(() => new Connection(NEXT_PUBLIC_HELIUS_RPC), [])

  const getQuote = async (
    fromMint: string,
    toMint: string,
    amount: number,
    slippageBps: number,
  ) => {
    try {
      const quote = await jupiterApi.quoteGet({
        inputMint: fromMint,
        outputMint: toMint,
        amount: amount,
        slippageBps,
      })
      return quote
    } catch (error) {
      console.error('Failed to get Jupiter quote:', error)
      return null
    }
  }

  const getSwapTransaction = async (
    quote: QuoteResponse,
    userPublicKey: string,
  ) => {
    try {
      const transaction = await jupiterApi.swapPost({
        swapRequest: {
          quoteResponse: quote,
          userPublicKey,
          dynamicComputeUnitLimit: true,
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
