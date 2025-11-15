"use client";
import { WalletMultiButton, useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import TopActions from "./TopActions";
import NotifBell from "./NotifBell";

export default function TopBar() {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  return (
    <div className="fixed right-4 top-3 z-[1000] flex items-center gap-2">
      {connected ? (
        <WalletMultiButton />
      ) : (
        <button
          onClick={() => setVisible(true)}
          className="px-3 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-sm"
        >
          Select Master
        </button>
      )}
      <TopActions />
      <NotifBell />
    </div>
  );
}
