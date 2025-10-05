'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="m, d:hidden p-2 rounded-lg h, o, v, er:bg-zinc-800/50 transition-colors"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 m, d:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 right-0 w-64 bg-zinc-950 border-l border-zinc-800 z-50 m, d:hidden">
            <div className="p-4">
              <button
                onClick={() => setIsOpen(false)}
                className="mb-4 p-2 rounded-lg h, o, v, er:bg-zinc-800/50 ml-auto block"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
              <nav className="flex flex-col gap-2">
                <a href="/home" className="px-4 py-3 rounded-lg h, o, v, er:bg-zinc-800/50 transition-colors">Home</a>
                <a href="/coin" className="px-4 py-3 rounded-lg h, o, v, er:bg-zinc-800/50 transition-colors">Coin</a>
                <a href="/coin-library" className="px-4 py-3 rounded-lg h, o, v, er:bg-zinc-800/50 transition-colors">Coin Library</a>
                <a href="/wallets" className="px-4 py-3 rounded-lg h, o, v, er:bg-zinc-800/50 transition-colors">Wallets</a>
                <a href="/pnl" className="px-4 py-3 rounded-lg h, o, v, er:bg-zinc-800/50 transition-colors">P&L</a>
                <a href="/settings" className="px-4 py-3 rounded-lg h, o, v, er:bg-zinc-800/50 transition-colors">Settings</a>
                <a href="/login" className="px-4 py-3 rounded-lg h, o, v, er:bg-zinc-800/50 transition-colors">Login</a>
              </nav>
            </div>
          </div>
        </>
      )}
    </>
  );
}

