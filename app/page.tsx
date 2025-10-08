export const dynamic = 'force-dynamic';

export default async function HomePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">The Keymaker</h1>
        <p className="text-sm text-zinc-400">
          Welcome. Use the navigation to access Engine, Settings, and more.
        </p>
      </div>
      <div className="bento">
        <section className="rounded-xl border border-zinc-800 bg-zinc-950/50">
          <div className="p-4 md:p-5 flex items-center justify-between">
            <div>
              <div className="font-medium">Keymaker</div>
              <div className="text-xs text-zinc-400">Manual cockpit and volume profiles</div>
            </div>
            <a
              href="/keymaker"
              className="px-3 py-2 rounded-2xl border border-zinc-800 text-sm hover:bg-zinc-800/50 transition-colors"
              aria-label="Open keymaker"
            >
              Open
            </a>
          </div>
        </section>
        <section className="rounded-xl border border-zinc-800 bg-zinc-950/50">
          <div className="p-4 md:p-5 flex items-center justify-between">
            <div>
              <div className="font-medium">Settings</div>
              <div className="text-xs text-zinc-400">RPC, JITO, preferences</div>
            </div>
            <a
              href="/settings"
              className="px-3 py-2 rounded-2xl border border-zinc-800 text-sm hover:bg-zinc-800/50 transition-colors"
              aria-label="Open settings"
            >
              Open
            </a>
          </div>
        </section>
        <section className="rounded-xl border border-zinc-800 bg-zinc-950/50">
          <div className="p-4 md:p-5 flex items-center justify-between">
            <div>
              <div className="font-medium">Guide</div>
              <div className="text-xs text-zinc-400">Usage tips and docs</div>
            </div>
            <a
              href="/guide"
              className="px-3 py-2 rounded-2xl border border-zinc-800 text-sm hover:bg-zinc-800/50 transition-colors"
              aria-label="Open guide"
            >
              Open
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
