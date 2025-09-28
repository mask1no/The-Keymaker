export default function AppHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/70 bg-zinc-950/70 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-4">
        <a href="/" className="text-xl md:text-2xl font-semibold tracking-wide px-1">
          The Keymaker
        </a>
        <a href="/login" className="rounded-2xl border border-zinc-800 leading-none px-3 py-2">
          Login
        </a>
      </div>
    </header>
  );
}
