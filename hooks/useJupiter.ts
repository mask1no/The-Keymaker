'use client';

import { createJupiterApiClient } from '@jup-ag/api';
import { Connection } from '@solana/web3.js';
import { NEXT_PUBLIC_HELIUS_RPC } from '@/constants';
import { useMemo } from 'react';

const jupiterApi = createJupiterApiClient();

export function useJupiter() {
  const connection = useMemo(() => new Connection(NEXT_PUBLIC_HELIUS_RPC), []);

  const getQuote = async (
    fromMint: string,
    toMint: string,
    amount: number,
    slippageBps = 50,
  ): Promise<unknown> => {
    try {
      const quote = await jupiterApi.quoteGet({
        inputMint: fromMint,
        outputMint: toMint,
        amount,
        slippageBps,
      });
      return quote as unknown;
    } catch (err) {
      console.error('Failed to get Jupiter quote:', err);
      return null;
    }
  };

  const getSwapTransaction = async (quote: unknown, userPublicKey: string): Promise<unknown> => {
    try {
      const transaction = await jupiterApi.swapPost({
        swapRequest: {
          // Type-narrowing of the quote is left to callers
          quoteResponse: quote as never,
          userPublicKey,
          dynamicComputeUnitLimit: true,
        },
      });
      return transaction as unknown;
    } catch (err) {
      console.error('Failed to get Jupiter swap transaction:', err);
      return null;
    }
  };

  return { getQuote, getSwapTransaction, connection };
}
