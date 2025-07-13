'use client';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, BackpackWalletAdapter } from '@solana/wallet-adapter-wallets';
import { Connection } from '@solana/web3.js';
import { FC, ReactNode, useMemo } from 'react';
import { toast } from 'react-hot-toast';
interface WalletContextProps {
  children: ReactNode;
}
export const WalletContext: FC<WalletContextProps> = ({ children }) => {
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new BackpackWalletAdapter()], []);
  const endpoint = process.env.NEXT_PUBLIC_HELIUS_RPC || 'https://api.devnet.solana.com';
  const connection = useMemo(() => new Connection(endpoint, 'confirmed'), [endpoint]);
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect onError={(error) => toast.error(`Wallet error: ${(error as Error).message}`)}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}; 