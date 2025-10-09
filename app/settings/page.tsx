import { getUiSettings, setUiSettings } from '@/lib/server/settings';

export const dynamic = 'force-dynamic';

async function update(formData: FormData) {
  'use server';
  const region = String(formData.get('region') || 'ffm');
  const priority = String(formData.get('priority') || 'med');
  const tipLamports = Number(formData.get('tipLamports') || 5000);
  const chunkSize = Number(formData.get('chunkSize') || 5);
  const concurrency = Number(formData.get('concurrency') || 4);
  const jitterMin = Number(formData.get('jitterMin') || 50);
  const jitterMax = Number(formData.get('jitterMax') || 150);
  const mode = String(formData.get('mode') || 'RPC') as any;
  const dryRun = String(formData.get('dryRun') || '') === 'on';
  const cluster = String(formData.get('cluster') || 'mainnet-beta') as any;
  setUiSettings({
    mode,
    region: region as any,
    priority: priority as any,
    tipLamports,
    chunkSize,
    concurrency,
    jitterMs: [jitterMin, jitterMax],
    dryRun,
    cluster,
  });
}

export default async function SettingsPage() {
  const ui = getUiSettings();
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
          <form action={update} className="space-y-3">
            <div>
              <label className="text-sm">Mode</label>
              <select
                name="mode"
                defaultValue={ui.mode}
                className="input w-full px-2 py-1 bg-zinc-900"
              >
                <option value="RPC">RPC</option>
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
      </div>
    </div>
  );
}
