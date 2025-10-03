import KCard from '@/components/UI/KCard';

export default function EventTable({ rows }: { rows: Array<{ time: string; event: string; summary: string }> }) {
  return (
    <KCard>
      <div className="text-sm font-medium mb-2">Last 10 Events</div>
      <div className="text-xs text-muted">{rows?.length ? null : 'No events yet'}</div>
      <div className="mt-2 divide-y" style={{ borderColor: 'var(--k-border)' }}>
        {rows?.slice(0, 10).map((r, i) => (
          <div key={i} className="py-2 grid grid-cols-[auto_1fr_auto] gap-3 items-center text-sm">
            <div className="text-xs text-muted">{r.time}</div>
            <div>{r.event}</div>
            <div className="text-xs text-muted">{r.summary}</div>
          </div>
        ))}
      </div>
    </KCard>
  );
}


