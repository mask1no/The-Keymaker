"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AsideNavClient() {
  const pathname = usePathname() || "/";
  const links = [
    { href: "/coin", label: "Coin" },
    { href: "/coin-library", label: "Coin Library" },
    { href: "/wallets", label: "Wallets" },
    { href: "/market-maker", label: "Market Maker" },
    { href: "/pnl", label: "PnL" },
    { href: "/settings", label: "Settings" }
  ];
  return (
    <aside className="border-r border-zinc-800 p-4 bg-[#0b0b0f]">
      <div className="font-bold mb-4 tracking-tight">The Keymaker</div>
      <nav className="grid gap-1">
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-2 rounded-xl transition-colors ${active ? "bg-zinc-800 text-white" : "text-zinc-300 hover:bg-zinc-900"}`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}


