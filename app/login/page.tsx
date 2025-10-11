'use client';
import WalletConnector from '@/components/WalletConnection/WalletConnector';

export default function LoginPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to Keymaker</h1>
          <p className="text-zinc-400">Connect your wallet to access the Solana trading platform</p>
        </div>
        <WalletConnector />
      </div>
    </div>
  );
}
