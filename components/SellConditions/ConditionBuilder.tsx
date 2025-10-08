'use client';
import { useEffect, useState } from 'react';

type Condition = {
  id: string;
  type: 'percent_target' | 'time_limit' | 'stop_loss';
  enabled: boolean;
  params: Record<string, number>;
};

export default function ConditionBuilder({
  groupId,
  mint,
  onChange,
}: {
  groupId?: string;
  mint?: string;
  onChange?: (conds: Condition[]) => void;
}) {
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  // Load existing conditions
  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        if (!groupId || !mint) return;
        const u = `/api/engine/sell-conditions?groupId=${encodeURIComponent(groupId)}&mint=${encodeURIComponent(mint)}`;
        const res = await fetch(u, { cache: 'no-store' });
        if (!res.ok) return;
        const j = await res.json();
        const arr: any[] = Array.isArray(j?.items) ? j.items : [];
        const first = arr.find((x) => x.groupId === groupId && x.mint === mint);
        if (first && Array.isArray(first.conditions) && !abort)
          setConditions(first.conditions as Condition[]);
      } catch {}
    })();
    return () => {
      abort = true;
    };
  }, [groupId, mint]);

  function add(type: Condition['type']) {
    const c: Condition = {
      id: Math.random().toString(36).slice(2),
      type,
      enabled: true,
      params:
        type === 'percent_target'
          ? { targetPercent: 20, sellPercent: 50 }
          : type === 'time_limit'
            ? { delayMs: 60_000, sellPercent: 100 }
            : { stopLossPercent: -15, sellPercent: 100 },
    };
    const next = [c, ...conditions];
    setConditions(next);
    onChange?.(next);
  }

  function update(id: string, key: string, value: number) {
    const next = conditions.map((c) =>
      c.id === id ? { ...c, params: { ...c.params, [key]: value } } : c,
    );
    setConditions(next);
    onChange?.(next);
  }
  function toggle(id: string) {
    const next = conditions.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c));
    setConditions(next);
    onChange?.(next);
  }
  function remove(id: string) {
    const next = conditions.filter((c) => c.id !== id);
    setConditions(next);
    onChange?.(next);
  }

  async function save() {
    if (!groupId || !mint) return;
    setSaving(true);
    try {
      const res = await fetch('/api/engine/sell-conditions', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ groupId, mint, conditions }),
      });
      if (res.ok) setLastSavedAt(Date.now());
    } catch {}
    setSaving(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          className="px-2 py-1 text-xs rounded bg-zinc-800"
          onClick={() => add('percent_target')}
        >
          + Percent Target
        </button>
        <button className="px-2 py-1 text-xs rounded bg-zinc-800" onClick={() => add('stop_loss')}>
          + Stop Loss
        </button>
        <button className="px-2 py-1 text-xs rounded bg-zinc-800" onClick={() => add('time_limit')}>
          + Time Limit
        </button>
        <div className="ml-auto flex items-center gap-2">
          {lastSavedAt ? (
            <span className="text-[10px] text-zinc-500">
              Saved {new Date(lastSavedAt).toLocaleTimeString()}
            </span>
          ) : null}
          <button
            className="px-2 py-1 text-xs rounded bg-green-700 disabled:opacity-60"
            onClick={save}
            disabled={!groupId || !mint || saving}
          >
            {saving ? 'Saving' : 'Save'}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {conditions.map((c) => (
          <div key={c.id} className="rounded border border-zinc-800 p-3">
            <div className="flex items-center justify-between text-xs">
              <div className="font-medium">{label(c)}</div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={c.enabled} onChange={() => toggle(c.id)} />{' '}
                  Enabled
                </label>
                <button
                  className="px-2 py-0.5 rounded border border-zinc-700"
                  onClick={() => remove(c.id)}
                >
                  Remove
                </button>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              {c.type === 'percent_target' && (
                <>
                  <NumberField
                    label="Target %"
                    value={c.params.targetPercent || 0}
                    onChange={(v) => update(c.id, 'targetPercent', v)}
                  />
                  <NumberField
                    label="Sell %"
                    value={c.params.sellPercent || 0}
                    onChange={(v) => update(c.id, 'sellPercent', v)}
                  />
                </>
              )}
              {c.type === 'stop_loss' && (
                <>
                  <NumberField
                    label="Stop Loss %"
                    value={c.params.stopLossPercent || 0}
                    onChange={(v) => update(c.id, 'stopLossPercent', v)}
                  />
                  <NumberField
                    label="Sell %"
                    value={c.params.sellPercent || 0}
                    onChange={(v) => update(c.id, 'sellPercent', v)}
                  />
                </>
              )}
              {c.type === 'time_limit' && (
                <>
                  <NumberField
                    label="Delay (ms)"
                    value={c.params.delayMs || 0}
                    onChange={(v) => update(c.id, 'delayMs', v)}
                  />
                  <NumberField
                    label="Sell %"
                    value={c.params.sellPercent || 0}
                    onChange={(v) => update(c.id, 'sellPercent', v)}
                  />
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <span className="w-24 text-zinc-400">{label}</span>
      <input
        className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 w-32"
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function label(c: Condition) {
  if (c.type === 'percent_target') return 'Percent Target';
  if (c.type === 'stop_loss') return 'Stop Loss';
  if (c.type === 'time_limit') return 'Time Limit';
  return c.type;
}
