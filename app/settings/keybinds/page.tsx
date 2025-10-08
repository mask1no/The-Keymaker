'use client';
import useSWR from 'swr';
import type { Hotkeys } from '@/lib/types/ui';

type UiPayload = { hotkeys: Hotkeys };

const fetcher = async (url: string): Promise<UiPayload> => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  return res.json();
};

function KeyInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (k: string) => void;
}) {
  return (
    <div>
      <label className="text-xs text-zinc-400">{label}</label>
      <input
        className="input bg-zinc-900 w-full"
        defaultValue={value}
        onBlur={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default function KeybindsPage() {
  const { data, error, mutate, isLoading } = useSWR<UiPayload>('/api/ui/settings', fetcher);
  if (isLoading) return <div className="p-6 text-sm text-zinc-500">Loading...</div>;
  if (error || !data) return <div className="p-6 text-sm text-red-400">Settings unavailable</div>;
  const hot = data.hotkeys;

  async function save(next: Hotkeys) {
    const res = await fetch('/api/ui/settings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ customFees: (data as any).customFees, hotkeys: next }),
    });
    if (res.ok) mutate();
  }

  function update<K extends keyof Hotkeys>(key: K) {
    return (val: string) => save({ ...hot, [key]: val });
  }

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-4">
      <h1 className="text-xl font-semibold">Keybinds</h1>
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <KeyInput label="Row 1" value={hot.row1} onChange={update('row1')} />
          <KeyInput label="Row 2" value={hot.row2} onChange={update('row2')} />
          <KeyInput label="Row 3" value={hot.row3} onChange={update('row3')} />
          <KeyInput label="Row 4" value={hot.row4} onChange={update('row4')} />
          <KeyInput label="Row 5" value={hot.row5} onChange={update('row5')} />
          <KeyInput label="Row 6" value={hot.row6} onChange={update('row6')} />
          <KeyInput label="Row 7" value={hot.row7} onChange={update('row7')} />
          <KeyInput label="Row 8" value={hot.row8} onChange={update('row8')} />
          <KeyInput label="Row 9" value={hot.row9} onChange={update('row9')} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <KeyInput label="Buy" value={hot.buy} onChange={update('buy')} />
          <KeyInput label="Sell" value={hot.sell} onChange={update('sell')} />
          <KeyInput
            label="Enqueue Toggle"
            value={hot.enqueueToggle}
            onChange={update('enqueueToggle')}
          />
          <KeyInput label="Refresh" value={hot.refresh} onChange={update('refresh')} />
          <KeyInput label="Simulate" value={hot.simulate} onChange={update('simulate')} />
          <KeyInput label="Send Live" value={hot.sendLive} onChange={update('sendLive')} />
          <KeyInput label="Help" value={hot.help} onChange={update('help')} />
        </div>
        <div className="text-xs text-zinc-400">
          Collisions are warned in UI where keys are used.
        </div>
      </div>
    </div>
  );
}
