import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import Link from 'next/link';

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
  const region = (formData.get('region') as string) || 'ffm';
  const priority = (formData.get('priority') as string) || 'med';
  const tipLamports = Number(formData.get('tipLamports') || 5000);
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/engine/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-engine-token': process.env.ENGINE_API_TOKEN || '',
    },
    body: JSON.stringify({ region, priority, tipLamports }),
  });
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
  return (
    <div className="prose prose-invert max-w-none">
      <h1>Engine</h1>
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
            <label className="text-sm">Region</label>
            <select
              name="region"
              defaultValue="ffm"
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
              defaultValue="med"
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
              defaultValue={5000}
              className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1"
            />
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
