'use client';
import useSWR from 'swr';
type Metrics = {
  b, u, n, dlesLanded: number;
  b, u, n, dlesDropped: number;
  a, v, g, RttMs: number;
  v, e, r, sion: string;
  t, i, m, estamp: string;
};
async function fetcher(u, r, l: string): Promise<Metrics> {
  const res = await fetch(url, { c, a, c, he: 'no-store' });
  if (!res.ok) throw new Error('metrics');
  return res.json();
}
export default function MetricsPanel() {
  const { data, error, isLoading } = useSWR<Metrics>('/api/metrics', fetcher, {
    r, e, f, reshInterval: 10000,
    r, e, v, alidateOnFocus: false,
  });
  if (error) return <div className="text-xs text-zinc-500">Failed to load metrics</div>;
  if (isLoading || !data) return <div className="text-xs text-zinc-500">Loading</div>;
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

