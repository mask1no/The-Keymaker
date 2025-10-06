'use client';
import useSWR from 'swr';
import type { CustomFees } from '@/lib/types/ui';

type UiPayload = { customFees: CustomFees };

const fetcher = async (url: string): Promise<UiPayload> => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  return res.json();
};

export default function CustomFeesPage() {
  const { data, error, mutate, isLoading } = useSWR<UiPayload>('/api/ui/settings', fetcher);
  if (isLoading) return <div className="p-6 text-sm text-zinc-500">Loading…</div>;
  if (error || !data) return <div className="p-6 text-sm text-red-400">Settings unavailable</div>;
  const fees = data.customFees;

  async function save(next: CustomFees) {
    const res = await fetch('/api/ui/settings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ customFees: next, hotkeys: (data as any).hotkeys }),
    });
    if (res.ok) mutate();
  }

  const pricePerCu = Math.ceil(
    (fees.rpc.buyPriorityLamports * 1e6) / Math.max(1, fees.rpc.cuLimit),
  );

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-4">
      <h1 className="text-xl font-semibold">Custom Fees</h1>
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <input
            id="use"
            type="checkbox"
            defaultChecked={fees.useCustomFees}
            onChange={(e) => save({ ...fees, useCustomFees: e.target.checked })}
          />
          <label htmlFor="use" className="text-sm">
            Use Custom Fees
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-400">RPC Buy Priority (lamports)</label>
            <input
              type="number"
              className="input bg-zinc-900 w-full"
              defaultValue={fees.rpc.buyPriorityLamports}
              onBlur={(e) =>
                save({ ...fees, rpc: { ...fees.rpc, buyPriorityLamports: Number(e.target.value) } })
              }
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400">RPC Sell Priority (lamports)</label>
            <input
              type="number"
              className="input bg-zinc-900 w-full"
              defaultValue={fees.rpc.sellPriorityLamports}
              onBlur={(e) =>
                save({
                  ...fees,
                  rpc: { ...fees.rpc, sellPriorityLamports: Number(e.target.value) },
                })
              }
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400">Compute Unit Limit</label>
            <input
              type="number"
              className="input bg-zinc-900 w-full"
              defaultValue={fees.rpc.cuLimit}
              onBlur={(e) =>
                save({ ...fees, rpc: { ...fees.rpc, cuLimit: Number(e.target.value) } })
              }
            />
            <div className="text-[11px] text-zinc-500 mt-1">SetComputeUnitLimit</div>
          </div>
          <div>
            <label className="text-xs text-zinc-400">Preset</label>
            <select
              className="input bg-zinc-900 w-full"
              defaultValue={fees.rpc.preset || 'med'}
              onChange={(e) =>
                save({ ...fees, rpc: { ...fees.rpc, preset: e.target.value as any } })
              }
            >
              <option value="low">low</option>
              <option value="med">med</option>
              <option value="high">high</option>
              <option value="vhigh">vhigh</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="auto"
              type="checkbox"
              defaultChecked={fees.rpc.autoPriority}
              onChange={(e) =>
                save({ ...fees, rpc: { ...fees.rpc, autoPriority: e.target.checked } })
              }
            />
            <label htmlFor="auto" className="text-xs text-zinc-400">
              Auto Priority (Helius)
            </label>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-400">Jito Buy Tip (lamports)</label>
            <input
              type="number"
              className="input bg-zinc-900 w-full"
              defaultValue={fees.jito.buyTipLamports}
              onBlur={(e) =>
                save({ ...fees, jito: { ...fees.jito, buyTipLamports: Number(e.target.value) } })
              }
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400">Jito Sell Tip (lamports)</label>
            <input
              type="number"
              className="input bg-zinc-900 w-full"
              defaultValue={fees.jito.sellTipLamports}
              onBlur={(e) =>
                save({ ...fees, jito: { ...fees.jito, sellTipLamports: Number(e.target.value) } })
              }
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="jito"
              type="checkbox"
              defaultChecked={fees.jito.enabled}
              onChange={(e) => save({ ...fees, jito: { ...fees.jito, enabled: e.target.checked } })}
            />
            <label htmlFor="jito" className="text-xs text-zinc-400">
              Enable Turbo UI
            </label>
          </div>
        </div>
        <div className="text-xs text-zinc-400">
          Effective network fee preview: µLamports/ComputeUnit ≈ {pricePerCu}
        </div>
      </div>
    </div>
  );
}
