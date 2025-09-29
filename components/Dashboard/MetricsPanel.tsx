'use client';
import useSWR from 'swr';
type Metrics = {
  bundlesLanded: number;
  bundlesDropped: number;
  avgRttMs: number;
  version: string;
  timestamp: string;
};
async function fetcher(url: string): Promise<Metrics> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('metrics');
  return res.json();
}
export default function MetricsPanel() {
  const { data, error, isLoading } = useSWR<Metrics>('/api/metrics', fetcher, {
    refreshInterval: 10000,
    revalidateOnFocus: false,
  });
  if (error) return <div className="text-xs text-zinc-500">Failed to load metrics</div>;
  if (isLoading || !data) return <div className="text-xs text-zinc-500">Loading…</div>;
  return (
    <div className="text-xs text-zinc-300 grid grid-cols-2 gap-2">
      
      <div className="rounded-lg border border-zinc-800 bg-black/30 p-2">
        
        <div className="text-zinc-400">Landed</div>
        <div className="text-zinc-100 text-sm font-semibold">{data.bundlesLanded}</div>
      </div>
      <div className="rounded-lg border border-zinc-800 bg-black/30 p-2">
        
        <div className="text-zinc-400">Dropped</div>
        <div className="text-zinc-100 text-sm font-semibold">{data.bundlesDropped}</div>
      </div>
      <div className="rounded-lg border border-zinc-800 bg-black/30 p-2">
        
        <div className="text-zinc-400">Avg RTT</div>
        <div className="text-zinc-100 text-sm font-semibold">{data.avgRttMs} ms</div>
      </div>
      <div className="rounded-lg border border-zinc-800 bg-black/30 p-2">
        
        <div className="text-zinc-400">Version</div>
        <div className="text-zinc-100 text-sm font-semibold">{data.version}</div>
      </div>
    </div>
  );
}
