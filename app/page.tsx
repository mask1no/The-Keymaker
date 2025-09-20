export default function HomePage() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">The Keymaker</h1>
      <p className="text-sm text-zinc-400">
        Welcome. Use the left navigation to access Bundler, Settings, and more.
      </p>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <a className="rounded-xl border border-zinc-800 p-4 hover:bg-zinc-900" href="/bundle">
          Bundle Engine
        </a>
        <a className="rounded-xl border border-zinc-800 p-4 hover:bg-zinc-900" href="/settings">
          Settings
        </a>
        <a className="rounded-xl border border-zinc-800 p-4 hover:bg-zinc-900" href="/guide">
          Guide
        </a>
      </div>
    </div>
  );
}
