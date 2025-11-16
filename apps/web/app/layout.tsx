import "./globals.css";
import { WalletKit } from "../providers/WalletProvider";
import Link from "next/link";
import TopBar from "../components/TopBar";
import AsideNavClient from "../components/AsideNavClient";

export const metadata = { title: "The Keymaker", description: "Multi-wallet snipe & MM" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const defaultRpc = process.env.NEXT_PUBLIC_DEFAULT_RPC || "https://api.mainnet-beta.solana.com";
  return (
    <html data-theme="dark">
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <WalletKit endpoint={defaultRpc}>
          <div className="grid grid-cols-[240px_1fr] min-h-screen">
            <AsideNavClient />
            <main className="relative">
              <TopBar />
              <div className="p-6 pt-16 max-w-7xl mx-auto w-full">{children}</div>
            </main>
          </div>
        </WalletKit>
      </body>
    </html>
  );
}


