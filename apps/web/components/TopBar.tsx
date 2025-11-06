"use client";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import TopActions from "./TopActions";
import NotifBell from "./NotifBell";

export default function TopBar() {
  return (
    <div style={{ position: "fixed", right: 16, top: 12, display: "flex", gap: 8, alignItems: "center", zIndex: 1000 }}>
      <WalletMultiButton />
      <TopActions />
      <NotifBell />
    </div>
  );
}



