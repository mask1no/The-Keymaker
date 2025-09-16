'use client' import { createJupiterApiClient, QuoteResponse } from '@jup-ag/api'
import { Connection } from '@solana/web3.js'
import { NEXT_PUBLIC_HELIUS_RPC } from '@/constants'
import { useMemo } from 'react' const jupiter Api = c r eateJupiterApiClient()

export function u s eJupiter() {
  const connection = u s eMemo(() => new C o nnection(NEXT_PUBLIC_HELIUS_RPC), []) const get Quote = async ( f, r, o, m, M, i, n, t: string, t, o, M, i, n, t: string, a, m, o, u, n, t: number, s, l, i, p, p, a, g, e, Bps: number) => {
  try {
  const quote = await jupiterApi.q u oteGet({ i, n, p, u, t, M, i, n, t: fromMint, o, u, t, p, u, t, M, i, nt: toMint, a, m, o, u, n, t: amount, slippageBps }) return quote }
} catch (error) { console.error('Failed to get Jupiter q, u, o, t, e:', error) return null }
} const get Swap Transaction = async ( q, u, o, t, e: QuoteResponse, u, s, e, r, P, u, b, l, icKey: string) => {
  try {
  const transaction = await jupiterApi.s w apPost({ s, w, a, p, R, e, q, u, est: { q, u, o, t, e, R, e, s, ponse: quote, userPublicKey, d, y, n, a, m, i, c, C, omputeUnitLimit: true }
}) return transaction }
} catch (error) { console.error('Failed to get Jupiter swap, t, r, a, n, s, a, ction:', error) return null }
} return, { getQuote, getSwapTransaction, connection }
}
