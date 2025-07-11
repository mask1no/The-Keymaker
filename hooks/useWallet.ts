import { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { debounce } from 'lodash';
import { NEXT_PUBLIC_HELIUS_RPC } from '../constants';
const connection = new Connection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed');

export function useWallet(walletAddr: string) {
  const [balance, setBalance] = useState(0);

  const fetchBalance = debounce(async () => {
    const bal = await connection.getBalance(new PublicKey(walletAddr));
    setBalance(bal / 1e9);
  }, 500);

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [walletAddr]);

  return balance;
} 