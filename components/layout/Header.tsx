export default function HeaderBar() {
  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800/70 bg-zinc-950/60">
      <div className="text-xl md:text-2xl font-semibold tracking-wide">The Keymaker</div>
      <nav className="flex items-center gap-2">
        <a href="/wallets" className="rounded-2xl border border-zinc-800 leading-none px-3 py-2">
          Wallets
        </a>
        <a href="/login" className="rounded-2xl border border-zinc-800 leading-none px-3 py-2">
          Login
        </a>
      </nav>
    </div>
  );
}
