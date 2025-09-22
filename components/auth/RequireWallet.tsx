'use client';
import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/UI/button';

export default function RequireWallet({ children }: { children: React.ReactNode }) {
  const { connected } = useWallet();
  if (!connected) {
    return (
      <div className="mx-auto max-w-xl mt-12 rounded-2xl border border-zinc-800 p-6 bg-black/40 text-center">
        <div className="text-sm text-zinc-400 mb-3">Connect your wallet to continue</div>
        <Button
          onClick={() => {
            document
              .querySelector('button,[aria-label="Connect Wallet"], .wallet-adapter-button')
              ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          }}
        >
          Connect Wallet
        </Button>
      </div>
    );
  }
  return <>{children}</>;
}