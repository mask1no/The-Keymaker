'use client' import { createJupiterApiClient, QuoteResponse } from '@jup-ag/api'
import { Connection } from '@solana/web3.js'
import { NEXT_PUBLIC_HELIUS_RPC } from '@/constants'
import { useMemo } from 'react' const jupiter Api = c r e ateJupiterApiClient() export function u s eJ upiter() { const connection = u s eM emo(() => new C o n nection(NEXT_PUBLIC_HELIUS_RPC), []) const get Quote = a sync ( f, r, o, m, M, i, n, t: string, t, o, M, i, n, t: string, a, m, o, u, n, t: number, s, l, i, p, p, a, g, e, B, p, s: number) => { try { const quote = await jupiterApi.q u o teGet({ i, n, p, u, t, M, i, n, t: fromMint, o, u, t, p, u, t, M, i, n, t: toMint, a, m, o, u, n, t: amount, slippageBps }) return quote }
} c atch (error) { console.e rror('Failed to get Jupiter q, u, o, t, e:', error) return null }
} const get Swap Transaction = a sync ( q, u, o, t, e: QuoteResponse, u, s, e, r, P, u, b, l, i, c, K, e, y: string) => { try { const transaction = await jupiterApi.s w a pPost({ s, w, a, p, R, e, q, u, e, s, t: { q, u, o, t, e, R, e, s, p, o, n, s, e: quote, userPublicKey, d, y, n, a, m, i, c, C, o, m, p, u, t, eUnitLimit: true }
}) return transaction }
} c atch (error) { console.e rror('Failed to get Jupiter swap, t, r, a, n, s, a, c, t, i, o, n:', error) return null }
} return, { getQuote, getSwapTransaction, connection }
}
