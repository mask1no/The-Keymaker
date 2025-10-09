'use client';

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/70 bg-zinc-950/70 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-4">
        <a href="/" className="text-xl md:text-2xl font-semibold tracking-wide focusable">
          Keymaker
        </a>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4 text-sm">
          <a className="focusable" href="/coin">
            Coin
          </a>
          <a className="focusable" href="/coin-library">
            Library
          </a>
          <a className="focusable" href="/wallets">
            Wallets
          </a>
          <a className="focusable" href="/keymaker">
            Keymaker
          </a>
          <a className="focusable" href="/pnl">
            P&L
          </a>
          <a className="focusable" href="/settings">
            Settings
          </a>
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2 rounded-lg hover:bg-zinc-800/50 transition-colors"
          onClick={() => {
            const menu = document.getElementById('mobile-menu');
            if (menu) {
              menu.classList.toggle('hidden');
            }
          }}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      <div id="mobile-menu" className="hidden md:hidden border-t border-zinc-800/70 bg-zinc-950/95 backdrop-blur">
        <nav className="flex flex-col gap-1 p-4">
          <a href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50 transition-all duration-200">
            <span className="text-lg">🏠</span>
            <span className="font-medium">Home</span>
          </a>
          <a href="/coin" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50 transition-all duration-200">
            <span className="text-lg">🪙</span>
            <span className="font-medium">Coin</span>
          </a>
          <a href="/coin-library" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50 transition-all duration-200">
            <span className="text-lg">📚</span>
            <span className="font-medium">Coin Library</span>
          </a>
          <a href="/wallets" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50 transition-all duration-200">
            <span className="text-lg">👛</span>
            <span className="font-medium">Wallets</span>
          </a>
          <a href="/pnl" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50 transition-all duration-200">
            <span className="text-lg">📊</span>
            <span className="font-medium">P&L</span>
          </a>
          <a href="/keymaker" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50 transition-all duration-200">
            <span className="text-lg">🔑</span>
            <span className="font-medium">Keymaker</span>
          </a>
          <a href="/settings" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50 transition-all duration-200">
            <span className="text-lg">⚙️</span>
            <span className="font-medium">Settings</span>
          </a>
        </nav>
      </div>
    </header>
  );
}