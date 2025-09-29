'use client';
import useSWR from 'swr';
type RecentRun = { id: number; executed_at: string; status: string; outcomes: any };
async function fetcher(url: string): Promise<{ recent: RecentRun[] }> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('recent');
  return res.json();
}
export default function RecentRunsPanel() {
  const { data, error, isLoading } = useSWR<{ recent: RecentRun[] }>(
    '/api/metrics/recent',
    fetcher,
    { refreshInterval: 10000, revalidateOnFocus: false },
  );
  if (error) return <div className="text-xs text-zinc-500">Failed to load recent runs</div>;
  if (isLoading || !data) return <div className="text-xs text-zinc-500">Loading…</div>;
  const recent = data.recent;
  if (!recent.length) return <div className="text-xs text-zinc-500">No recent runs</div>;
  return (
    <div className="space-y-2">
      
      {recent.map((r) => (
        <div
          key={r.id}
          className="flex items-center justify-between rounded-lg border border-zinc-800 bg-black/30 px-2 py-1 text-xs"
        >
          
          <div className="truncate">
            
            <span className="text-zinc-400 mr-2">#{r.id}</span>
            <span
              className={
                r.status === 'landed'
                  ? 'text-emerald-400'
                  : r.status === 'pending'
                    ? 'text-yellow-400'
                    : 'text-red-400'
              }
            >
              
              {r.status}
            </span>
          </div>
          <div className="text-zinc-500">{new Date(r.executed_at).toLocaleTimeString()}</div>
        </div>
      ))}
    </div>
  );
}
