'use client';
import { useEffect, useState } from 'react';

type Row = { id: string; executed_at?: string; status?: string };

export default function EventsPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let t: any;
    const tick = async () => {
      try {
        const r = await fetch('/api/metrics/recent', { cache: 'no-store' });
        if (!r.ok) throw new Error(`failed: ${r.status}`);
        const j = await r.json();
        setRows(Array.isArray(j.recent) ? j.recent : []);
        setError(null);
      } catch (e: unknown) {
        setError((e as Error)?.message || 'failed');
      }
      t = setTimeout(tick, 4000);
    };
    tick();
    return () => clearTimeout(t);
  }, []);

  if (error) return <div className="text-xs text-red-400">{error}</div>;
  if (!rows.length) return <div className="text-xs text-zinc-500">No events yet</div>;

  return (
    <div className="space-y-1">
      {rows.map((r:any) => (
        <div key={r.id} className="text-xs text-zinc-400 flex items-center justify-between">
          <span>#{r.id}</span>
          <span className={r.status === 'success' ? 'text-emerald-400' : r.status === 'failed' ? 'text-red-400' : 'text-amber-400'}>
            {r.status || 'unknown'}
          </span>
        </div>
      ))}
    </div>
  );
}



