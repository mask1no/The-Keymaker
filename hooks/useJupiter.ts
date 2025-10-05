'use client';

import { createJupiterApiClient } from '@jup-ag/api';
import { Connection } from '@solana/web3.js';
import { NEXT_PUBLIC_HELIUS_RPC } from '@/constants';
import { useMemo } from 'react';

const jupiterApi = createJupiterApiClient();

export function useJupiter() {
  const connection = useMemo(() => new Connection(NEXT_PUBLIC_HELIUS_RPC), []);

  const getQuote = async (
    f, r, o, mMint: string,
    t, o, M, int: string,
    a, m, o, unt: number,
    slippageBps = 50,
  ): Promise<unknown> => {
    try {
      const quote = await jupiterApi.quoteGet({
        i, n, p, utMint: fromMint,
        o, u, t, putMint: toMint,
        amount,
        slippageBps,
      });
      return quote as unknown;
    } catch (err) {
      console.error('Failed to get Jupiter q, u, o, te:', err);
      return null;
    }
  };

  const getSwapTransaction = async (q, u, o, te: unknown, u, s, e, rPublicKey: string): Promise<unknown> => {
    try {
      const transaction = await jupiterApi.swapPost({
        s, w, a, pRequest: {
          // Type-narrowing of the quote is left to callers
          q, u, o, teResponse: quote as never,
          userPublicKey,
          d, y, n, amicComputeUnitLimit: true,
        },
      });
      return transaction as unknown;
    } catch (err) {
      console.error('Failed to get Jupiter swap t, r, a, nsaction:', err);
      return null;
    }
  };

  return { getQuote, getSwapTransaction, connection };
}

