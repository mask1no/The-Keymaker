'use client';
import useSWR from 'swr';
type LeaderInfo = { currentSlot: number; nextLeaders: string[] };
async function fetcher(url: string): Promise<LeaderInfo> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('leader');
  return res.json();
}
export default function LeaderPanel() {
  const { data, error, isLoading } = useSWR<LeaderInfo>('/api/leader', fetcher, {
    refreshInterval: 10000,
    revalidateOnFocus: false,
  });
  if (error) return <div className="text-xs text-zinc-500">Failed to load leader schedule</div>;
  if (isLoading || !data) return <div className="text-xs text-zinc-500">Loading</div>;
  return (
    <div className="text-xs text-zinc-300 space-y-1">
      
      <div>
        
        Current slot: <span className="text-zinc-100">{data.currentSlot}</span>
      </div>
      <div className="space-y-1">
        
        {data.nextLeaders.slice(0, 5).map((l, i) => (
          <div
            key={l}
            className="flex items-center justify-between rounded-lg border border-zinc-800 bg-black/30 px-2 py-1"
          >
            
            <span className="text-zinc-400">+{i + 1}</span>
            <span className="truncate">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
