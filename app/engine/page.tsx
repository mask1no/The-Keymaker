import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { getUiSettings, setUiSettings } from '@/lib/server/settings';
import { armedUntil, isArmed } from '@/lib/server/arming';
import { revalidatePath } from 'next/cache';
import type { ExecutionMode } from '@/lib/core/src/engine';
// SSR-only; avoid client imports

export const dynamic = 'force-dynamic';

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}

async function getDepositAddress(): Promise<string | null> {
  try {
    const d = await fetchJson<{ publicKey: string }>(
      `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/engine/deposit-address`,
      { cache: 'no-store' },
    );
    return d.publicKey;
  } catch {
    return null;
  }
}

async function submitTestBundle(formData: FormData) {
  'use server';
  const mode = (formData.get('mode') as ExecutionMode) || 'JITO_BUNDLE';
  const region = (formData.get('region') as string) || 'ffm';
  const priority = (formData.get('priority') as string) || 'med';
  const tipLamports = Number(formData.get('tipLamports') || 5000);
  const chunkSize = Number(formData.get('chunkSize') || 5);
  const concurrency = Number(formData.get('concurrency') || 4);
  const jitterMin = Number(formData.get('jitterMin') || 50);
  const jitterMax = Number(formData.get('jitterMax') || 150);
  const dryRun = String(formData.get('dryRun')) === 'on';
  const cluster = (formData.get('cluster') as string) || 'mainnet-beta';
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/engine/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-engine-token': process.env.ENGINE_API_TOKEN || '',
    },
    body: JSON.stringify({
      mode,
      region,
      priority,
      tipLamports,
      chunkSize,
      concurrency,
      jitterMs: [jitterMin, jitterMax],
      dryRun,
      cluster,
    }),
  });
  revalidatePath('/engine');
}

async function toggleMode(formData: FormData) {
  'use server';
  const mode = (formData.get('mode') as ExecutionMode) || 'JITO_BUNDLE';
  setUiSettings({ mode });
  revalidatePath('/engine');
}

async function updateSettings(formData: FormData) {
  'use server';
  const entries: Record<string, string> = {} as any;
  for (const [k, v] of formData.entries()) entries[k] = String(v);
  const next: any = {};
  if (entries.region) next.region = entries.region;
  if (entries.priority) next.priority = entries.priority;
  if (entries.tipLamports) next.tipLamports = Number(entries.tipLamports);
  if (entries.chunkSize) next.chunkSize = Number(entries.chunkSize);
  if (entries.concurrency) next.concurrency = Number(entries.concurrency);
  const jm0 = Number(entries.jitterMin || 50);
  const jm1 = Number(entries.jitterMax || 150);
  next.jitterMs = [jm0, jm1];
  if (entries.dryRun !== undefined) next.dryRun = entries.dryRun === 'on';
  if (entries.cluster) next.cluster = entries.cluster as any;
  setUiSettings(next);
  revalidatePath('/engine');
}

async function armAction(formData: FormData) {
  'use server';
  const minutes = Number(formData.get('minutes') || 15);
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/ops/arm`, {
    method: 'POST',
    headers: {
      'x-engine-token': process.env.ENGINE_API_TOKEN || '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ minutes }),
  });
  revalidatePath('/engine');
}

async function disarmAction() {
  'use server';
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/ops/disarm`, {
    method: 'POST',
    headers: { 'x-engine-token': process.env.ENGINE_API_TOKEN || '' },
  });
  revalidatePath('/engine');
}

function readTodayJournal(): Array<{ time: string; ev: string; summary: string }> {
  try {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const file = join(process.cwd(), 'data', `journal.${y}-${m}-${d}.ndjson`);
    const raw = readFileSync(file, 'utf8').trim();
    if (!raw) return [];
    const lines = raw.split('\n').slice(-10);
    return lines.map((l) => {
      const o = JSON.parse(l);
      const ev = o.ev;
      const time = new Date().toISOString().slice(11, 19);
      let summary = '';
      if (ev === 'submit') summary = `bundleId=${o.bundleId} tip=${o.tipLamports}`;
      else if (ev === 'status')
        summary = `bundleId=${o.bundleId} statuses=${o.statuses?.length || 0}`;
      else if (ev === 'fund') summary = `txSig=${o.txSig} lamports=${o.lamports}`;
      return { time, ev, summary };
    });
  } catch {
    return [];
  }
}

export default async function Page() {
  const deposit = await getDepositAddress();
  const events = readTodayJournal();
  const ui = getUiSettings();
  const armed = isArmed();
  const armedTs = armedUntil();
  return (
    <div className="prose prose-invert max-w-none">
      <Style />
      <h1>Engine</h1>
      <div className="mb-4 text-xs flex items-center gap-3">
        <span className="badge">Execution Mode: {ui.mode}</span>
        <span className="badge" style={{ color: armed ? '#64d3a5' : '#eab308' }}>
          {armed ? `ARMED until ${new Date(armedTs).toISOString().slice(11, 16)}` : 'DISARMED'}
        </span>
        <span className="badge">DryRun: {ui.dryRun ? 'ON' : 'OFF'}</span>
        <span className="badge">Cluster: {ui.cluster}</span>
        <a href="/settings" className="badge" style={{ textDecoration: 'none' }}>
          Settings →
        </a>
      </div>
      <section className="card mb-4">
        <div className="label mb-2">Verify Deposit & Proof</div>
        <div className="text-sm">
          <div className="mb-2">Deposit pubkey: {deposit || 'Not configured'}</div>
          <div className="mb-1">Step 1: Cross-check</div>
          <pre className="text-xs bg-zinc-900 p-2 rounded">
            PowerShell: solana-keygen pubkey "$Env:KEYPAIR_JSON"{'\n'}macOS/Linux: solana-keygen
            pubkey ~/keymaker-payer.json
          </pre>
          <div className="mb-1">Step 2: Proof (no funds)</div>
          <pre className="text-xs bg-zinc-900 p-2 rounded">
            curl -s{' '}
            {`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}` + '/api/engine/prove'}{' '}
            -H "x-engine-token: $ENGINE_API_TOKEN"
          </pre>
        </div>
      </section>
      <section className="card mb-4">
        <div className="label mb-2">Safety</div>
        <form action={armAction} className="inline-block mr-2">
          <input type="hidden" name="minutes" value="15" />
          <button className="bg-zinc-800 hover:bg-zinc-700 text-xs rounded px-2 py-1" type="submit">
            Arm 15m
          </button>
        </form>
        <form action={disarmAction} className="inline-block">
          <button className="bg-zinc-800 hover:bg-zinc-700 text-xs rounded px-2 py-1" type="submit">
            Disarm
          </button>
        </form>
        <div className="text-xs text-zinc-400 mt-2">
          Live submits require KEYMAKER_ALLOW_LIVE=YES and an armed window. DryRun bypasses arming
          and never sends funds.
        </div>
      </section>
      <div className="bento mb-4">
        <form action={toggleMode} className={`card ${ui.mode === 'JITO_BUNDLE' ? 'active' : ''}`}>
          <input type="hidden" name="mode" value="JITO_BUNDLE" />
          <button type="submit" className="w-full text-left">
            <div className="label mb-1">Mode</div>
            <div className="text-lg font-semibold">Jito Bundle</div>
            <div className="text-sm text-zinc-400">Same-block ordered bundle with tip</div>
          </button>
        </form>
        <form action={toggleMode} className={`card ${ui.mode === 'RPC_FANOUT' ? 'active' : ''}`}>
          <input type="hidden" name="mode" value="RPC_FANOUT" />
          <button type="submit" className="w-full text-left">
            <div className="label mb-1">Mode</div>
            <div className="text-lg font-semibold">Direct RPC</div>
            <div className="text-sm text-zinc-400">Concurrency and jitter; non-atomic</div>
          </button>
        </form>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <section className="col-span-1 border border-zinc-800 rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-2">Deposit Address</h2>
          {deposit ? (
            <div className="text-sm break-all">{deposit}</div>
          ) : (
            <div className="text-sm text-zinc-400">Not configured</div>
          )}
        </section>
        <section className="col-span-1 border border-zinc-800 rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-2">Run Test Bundle</h2>
          <form action={submitTestBundle} className="flex flex-col gap-2">
            <label className="text-sm">Mode</label>
            <select
              name="mode"
              defaultValue={ui.mode}
              className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1"
            >
              <option value="JITO_BUNDLE">JITO_BUNDLE</option>
              <option value="RPC_FANOUT">RPC_FANOUT</option>
            </select>
            <label className="text-sm">Dry Run</label>
            <input type="checkbox" name="dryRun" defaultChecked={ui.dryRun ?? true} />
            <label className="text-sm">Cluster (RPC)</label>
            <select
              name="cluster"
              defaultValue={ui.cluster || 'mainnet-beta'}
              className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1"
            >
              <option value="mainnet-beta">mainnet-beta</option>
              <option value="devnet">devnet</option>
            </select>
            <label className="text-sm">Region</label>
            <select
              name="region"
              defaultValue={ui.region}
              className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1"
            >
              <option value="ffm">ffm</option>
              <option value="ams">ams</option>
              <option value="ny">ny</option>
              <option value="tokyo">tokyo</option>
            </select>
            <label className="text-sm">Priority</label>
            <select
              name="priority"
              defaultValue={ui.priority}
              className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1"
            >
              <option value="low">low</option>
              <option value="med">med</option>
              <option value="high">high</option>
              <option value="vhigh">vhigh</option>
            </select>
            <label className="text-sm">Tip Lamports</label>
            <input
              type="number"
              name="tipLamports"
              defaultValue={ui.tipLamports ?? 5000}
              className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm">Chunk Size</label>
                <input
                  type="number"
                  name="chunkSize"
                  defaultValue={ui.chunkSize}
                  className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 w-full"
                />
              </div>
              <div>
                <label className="text-sm">Concurrency</label>
                <input
                  type="number"
                  name="concurrency"
                  defaultValue={ui.concurrency}
                  className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 w-full"
                />
              </div>
              <div>
                <label className="text-sm">Jitter Min (ms)</label>
                <input
                  type="number"
                  name="jitterMin"
                  defaultValue={ui.jitterMs?.[0] ?? 50}
                  className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 w-full"
                />
              </div>
              <div>
                <label className="text-sm">Jitter Max (ms)</label>
                <input
                  type="number"
                  name="jitterMax"
                  defaultValue={ui.jitterMs?.[1] ?? 150}
                  className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 w-full"
                />
              </div>
            </div>
            <button
              type="submit"
              className="mt-2 bg-zinc-800 hover:bg-zinc-700 text-sm rounded px-3 py-1 w-fit"
            >
              Submit
            </button>
          </form>
        </section>
        <section className="col-span-1 border border-zinc-800 rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-2">Last 10 Events</h2>
          <div className="text-sm">
            <table className="w-full text-left text-xs">
              <thead>
                <tr>
                  <th className="py-1">Time</th>
                  <th className="py-1">Event</th>
                  <th className="py-1">Summary</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e, i) => (
                  <tr key={i} className="border-t border-zinc-800">
                    <td className="py-1 align-top">{e.time}</td>
                    <td className="py-1 align-top">{e.ev}</td>
                    <td className="py-1 align-top break-all">{e.summary}</td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-2 text-zinc-500">
                      No events yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

// Styles for bento and cards (SSR-only)
export const metadata = {} as any;
export const viewport = {} as any;
// Using a style tag here avoids client bundles; Next will inline CSS
export function Style() {
  return (
    <style>{`
:root{ --bg:#0b0e13; --card:#121826; --cardActive:#1d2a44; --text:#e6edf3; --muted:#9fb0c0; --accent:#6aa9ff; --accent2:#64d3a5; }
@media (prefers-color-scheme: light){ :root{ --bg:#f7f9fc; --card:#ffffff; --cardActive:#eaf1ff; --text:#0b1220; --muted:#475569; --accent:#245bcc; --accent2:#0c8f63; } }
.bento{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.card{ background:var(--card); border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:16px; transition:background .15s,border-color .15s,transform .06s; }
.card.active{ background:var(--cardActive); border-color:var(--accent); box-shadow:0 0 0 1px rgba(100,149,237,.25) inset; }
.card:active{ transform:translateY(1px); }
.badge{ display:inline-block; padding:2px 8px; border-radius:999px; background:var(--cardActive); color:var(--accent); font-weight:600; font-size:12px; }
.label{ color:var(--muted); font-size:12px; text-transform:uppercase; letter-spacing:.08em; }
    `}</style>
  );
}
