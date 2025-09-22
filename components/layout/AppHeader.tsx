'use client';
import Link from 'next/link';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import StatusCluster from './StatusCluster';

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/70 bg-zinc-950/60 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="text-xl md:text-2xl font-semibold tracking-wide">
          The Keymaker
        </Link>
        <div className="flex items-center gap-4">
          <div className="hidden md:block">
            <StatusCluster />
          </div>
          <WalletMultiButton className="!rounded-2xl !h-8 !text-sm" />
        </div>
      </div>
    </header>
  );
}
