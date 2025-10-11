'use client';

import { useState, useEffect, useCallback } from 'react';

interface SolBalance {
  balance: number;
  balanceLamports: number;
}

interface TokenBalance {
  balance: number;
  decimals: number;
  error?: string;
}

interface WalletBalance {
  wallet: string;
  sol: SolBalance;
  tokens: Record<string, TokenBalance>;
  error?: string;
}

interface UseWalletBalancesOptions {
  wallets: string[];
  tokens?: string[];
  refreshInterval?: number; // in milliseconds
  enabled?: boolean;
}

export function useWalletBalances({
  wallets,
  tokens = [],
  refreshInterval = 30000, // 30 seconds default
  enabled = true,
}: UseWalletBalancesOptions) {
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!enabled || wallets.length === 0) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/wallets/balances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallets,
          tokens,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setBalances(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch balances');
      }
    } catch (err) {
      console.error('Error fetching wallet balances:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [wallets, tokens, enabled]);

  // Initial fetch
  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // Set up interval for automatic refresh
  useEffect(() => {
    if (!enabled || refreshInterval <= 0) {
      return;
    }

    const interval = setInterval(fetchBalances, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchBalances, refreshInterval, enabled]);

  // Helper function to get balance for a specific wallet
  const getWalletBalance = useCallback(
    (walletAddress: string) => {
      return balances.find((balance) => balance.wallet === walletAddress);
    },
    [balances],
  );

  // Helper function to get total SOL balance across all wallets
  const getTotalSolBalance = useCallback(() => {
    return balances.reduce((total, balance) => {
      if (balance.error) return total;
      return total + balance.sol.balance;
    }, 0);
  }, [balances]);

  // Helper function to get total token balance across all wallets
  const getTotalTokenBalance = useCallback(
    (tokenMint: string) => {
      return balances.reduce((total, balance) => {
        if (balance.error || !balance.tokens[tokenMint]) return total;
        return total + balance.tokens[tokenMint].balance;
      }, 0);
    },
    [balances],
  );

  return {
    balances,
    isLoading,
    error,
    refetch: fetchBalances,
    getWalletBalance,
    getTotalSolBalance,
    getTotalTokenBalance,
  };
}
