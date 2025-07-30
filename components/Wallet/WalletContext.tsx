'use client';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { FC, ReactNode, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { NEXT_PUBLIC_HELIUS_RPC } from '@/constants';

interface WalletContextProps {
  children: ReactNode;
}

export const WalletContext: FC<WalletContextProps> = ({ children }) => {
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);
  // Ensure we have a valid endpoint URL
  const endpoint = NEXT_PUBLIC_HELIUS_RPC.startsWith('http') 
    ? NEXT_PUBLIC_HELIUS_RPC 
    : 'https://api.mainnet-beta.solana.com';
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect onError={(error) => toast.error(`Wallet error: ${(error as Error).message}`)}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}; 