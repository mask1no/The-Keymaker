export const dynamic = 'force-dynamic';

async function getUi(): Promise<any> {
  const base = '';
  const res = await fetch(`${base}/api/ui/settings`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export default async function SettingsPage() {
  const ui = await getUi();
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-4 text-xs flex items-center gap-3">
        <span className="badge">Execution Mode: {ui.mode}</span>
        <span className="badge">DryRun: {ui.dryRun ? 'ON' : 'OFF'}</span>
        <span className="badge">Cluster: {ui.cluster}</span>
        <a href="/engine" className="badge" style={{ textDecoration: 'none' }}>
          Engine →
        </a>
      </div>
      <h1 className="h1 mb-6">Settings</h1>
      <div className="bento">
        <section className="card">
          <div className="label mb-2">Engine Defaults</div>
          <form action={async (formData: FormData) => {
            'use server';
            const body = {
              mode: String(formData.get('mode') || 'JITO_BUNDLE'),
              region: String(formData.get('region') || 'ffm'),
              priority: String(formData.get('priority') || 'med'),
              tipLamports: Number(formData.get('tipLamports') || 5000),
              chunkSize: Number(formData.get('chunkSize') || 5),
              concurrency: Number(formData.get('concurrency') || 4),
              jitterMs: [Number(formData.get('jitterMin') || 50), Number(formData.get('jitterMax') || 150)],
              dryRun: String(formData.get('dryRun') || '') === 'on',
              liveMode: String(formData.get('liveMode') || '') === 'on',
              cluster: String(formData.get('cluster') || 'mainnet-beta'),
            } as any;
            await fetch('/api/ui/settings', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
          }} className="space-y-3">
            <div>
              <label className="text-sm">Mode</label>
              <select
                name="mode"
                defaultValue={ui.mode}
                className="input w-full px-2 py-1 bg-zinc-900"
              >
                <option value="JITO_BUNDLE">JITO_BUNDLE</option>
                <option value="RPC_FANOUT">RPC_FANOUT</option>
              </select>
            </div>
            <div>
              <label className="text-sm">Region</label>
              <select
                name="region"
                defaultValue={ui.region}
                className="input w-full px-2 py-1 bg-zinc-900"
              >
                <option value="ffm">ffm</option>
                <option value="ams">ams</option>
                <option value="ny">ny</option>
                <option value="tokyo">tokyo</option>
              </select>
            </div>
            <div>
              <label className="text-sm">Priority</label>
              <select
                name="priority"
                defaultValue={ui.priority}
                className="input w-full px-2 py-1 bg-zinc-900"
              >
                <option value="low">low</option>
                <option value="med">med</option>
                <option value="high">high</option>
                <option value="vhigh">vhigh</option>
              </select>
            </div>
            <div>
              <label className="text-sm">Dry Run</label>
              <input type="checkbox" name="dryRun" defaultChecked={ui.dryRun ?? true} />
            </div>
          <div>
            <label className="text-sm">Live Mode (requires env + arming)</label>
            <input type="checkbox" name="liveMode" defaultChecked={ui.liveMode ?? false} />
            <div className="text-xs text-yellow-400 mt-1">
              Live sends require: KEYMAKER_ALLOW_LIVE=YES and (optional) arming.
            </div>
          </div>
            <div>
              <label className="text-sm">Cluster (RPC)</label>
              <select
                name="cluster"
                defaultValue={ui.cluster || 'mainnet-beta'}
                className="input w-full px-2 py-1 bg-zinc-900"
              >
                <option value="mainnet-beta">mainnet-beta</option>
                <option value="devnet">devnet</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm">Tip Lamports</label>
                <input
                  name="tipLamports"
                  type="number"
                  defaultValue={ui.tipLamports ?? 5000}
                  className="input w-full px-2 py-1 bg-zinc-900"
                />
              </div>
              <div>
                <label className="text-sm">Chunk Size (Jito)</label>
                <input
                  name="chunkSize"
                  type="number"
                  defaultValue={ui.chunkSize}
                  className="input w-full px-2 py-1 bg-zinc-900"
                />
              </div>
              <div>
                <label className="text-sm">Concurrency (RPC)</label>
                <input
                  name="concurrency"
                  type="number"
                  defaultValue={ui.concurrency}
                  className="input w-full px-2 py-1 bg-zinc-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm">Jitter Min</label>
                  <input
                    name="jitterMin"
                    type="number"
                    defaultValue={ui.jitterMs?.[0] ?? 50}
                    className="input w-full px-2 py-1 bg-zinc-900"
                  />
                </div>
                <div>
                  <label className="text-sm">Jitter Max</label>
                  <input
                    name="jitterMax"
                    type="number"
                    defaultValue={ui.jitterMs?.[1] ?? 150}
                    className="input w-full px-2 py-1 bg-zinc-900"
                  />
                </div>
              </div>
            </div>
            <button type="submit" className="button px-3 py-1 bg-zinc-800 hover:bg-zinc-700">
              Save
            </button>
          </form>
        </section>
        <section className="card">
          <div className="label mb-2">Notes</div>
          <p className="p-muted text-sm">
            These defaults are used by the Engine UI and API when optional fields are not provided.
          </p>
        </section>
        <section className="card">
          <div className="label mb-2">Logs & Exports</div>
          <div className="flex items-center gap-3 text-sm">
            <a href="/api/logs/download" className="rounded px-3 py-2 border border-zinc-700 hover:bg-zinc-800/50">Download logs (NDJSON)</a>
            <a href="/api/pnl/export" className="rounded px-3 py-2 border border-zinc-700 hover:bg-zinc-800/50">Export P&L (CSV)</a>
          </div>
        </section>
      </div>
    </div>
  );
}

