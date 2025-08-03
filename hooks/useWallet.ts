import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useDebounce } from 'use-debounce';
import { getConnection } from '@/lib/network';

export function useWalletBalance() {
  const { publicKey } = useWallet();
  const connection = getConnection('confirmed');
  const [balance, setBalance] = useState(0);
  const [debouncedFetch] = useDebounce(async () => {
    if (!publicKey) return;
    const cached = localStorage.getItem(`balance_${publicKey.toBase58()}`);
    const timestamp = localStorage.getItem(`balance_ts_${publicKey.toBase58()}`);
    if (cached && timestamp && Date.now() - parseInt(timestamp) < 10000) {
      setBalance(parseFloat(cached));
      return;
    }
    const bal = await connection.getBalance(publicKey);
    setBalance(bal / 1e9);
    localStorage.setItem(`balance_${publicKey.toBase58()}`, (bal / 1e9).toString());
    localStorage.setItem(`balance_ts_${publicKey.toBase58()}`, Date.now().toString());
  }, 500);

  useEffect(() => {
    debouncedFetch();
  }, [publicKey]);

  return balance;
} 