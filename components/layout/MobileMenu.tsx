'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="md:hidden p-2 rounded-lg hover:bg-zinc-800/50 transition-colors"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 right-0 w-64 bg-zinc-950 border-l border-zinc-800 z-50 md:hidden">
            <div className="p-4">
              <button
                onClick={() => setIsOpen(false)}
                className="mb-4 p-2 rounded-lg hover:bg-zinc-800/50 ml-auto block"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
              <nav className="flex flex-col gap-2">
                <a href="/engine" className="px-4 py-3 rounded-lg hover:bg-zinc-800/50 transition-colors">
                  Engine
                </a>
                <a href="/bundle" className="px-4 py-3 rounded-lg hover:bg-zinc-800/50 transition-colors">
                  Bundler
                </a>
                <a href="/settings" className="px-4 py-3 rounded-lg hover:bg-zinc-800/50 transition-colors">
                  Settings
                </a>
                <a href="/wallets" className="px-4 py-3 rounded-lg hover:bg-zinc-800/50 transition-colors">
                  Wallets
                </a>
                <a href="/login" className="px-4 py-3 rounded-lg hover:bg-zinc-800/50 transition-colors">
                  Login
                </a>
              </nav>
            </div>
          </div>
        </>
      )}
    </>
  );
}
