'use client';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-900 to-black">
      <h1 className="text-2xl text-white/90 font-mono">The Keymaker: Test Page</h1>
      <WalletMultiButton className="mt-4 rounded-xl bg-aqua/20 hover:bg-aqua/30 text-white/90" />
    </div>
  );
} 