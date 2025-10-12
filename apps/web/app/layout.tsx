import "./globals.css";
import { WalletKit } from "../providers/WalletProvider";
import Link from "next/link";

export const metadata = { title: "The Keymaker", description: "Multi-wallet snipe & MM" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const defaultRpc = process.env.NEXT_PUBLIC_DEFAULT_RPC || "https://api.mainnet-beta.solana.com";
  return (
    <html data-theme="dark">
      <body style={{ background: "#0b0b0c", color: "#e4e4e7", minHeight: "100vh" }}>
        <WalletKit endpoint={defaultRpc}>
          <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "100vh" }}>
            <aside style={{ borderRight: "1px solid #27272a", padding: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 16 }}>The Keymaker</div>
              <nav style={{ display: "grid", gap: 8 }}>
                <Link href="/coin">Coin</Link>
                <Link href="/coin-library">Coin Library</Link>
                <Link href="/wallets">Wallets</Link>
                <Link href="/market-maker">Market Maker</Link>
                <Link href="/pnl">PnL</Link>
                <Link href="/settings">Settings</Link>
              </nav>
            </aside>
            <main>{children}</main>
          </div>
        </WalletKit>
      </body>
    </html>
  );
}


