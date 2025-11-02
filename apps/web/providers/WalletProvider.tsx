"use client";
import { FC, PropsWithChildren, useMemo } from "react";
import { ConnectionProvider, WalletProvider as SolWalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import "@solana/wallet-adapter-react-ui/styles.css";

export const WalletKit: FC<PropsWithChildren<{ endpoint?: string }>> = ({ endpoint, children }) => {
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);
  return (
    <ConnectionProvider endpoint={endpoint ?? process.env.NEXT_PUBLIC_DEFAULT_RPC ?? "https://api.mainnet-beta.solana.com"}>
      <SolWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolWalletProvider>
    </ConnectionProvider>
  );
};


