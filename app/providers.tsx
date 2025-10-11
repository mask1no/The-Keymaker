import SolanaWalletProvider from '@/components/providers/Wallet';

export function Providers({ children }: { children: React.ReactNode }) {
  return <SolanaWalletProvider>{children}</SolanaWalletProvider>;
}
