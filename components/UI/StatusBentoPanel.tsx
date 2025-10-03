'use client';
import { useHealth } from '@/hooks/useHealth';
import type { HealthStatus, HealthLight } from '@/lib/types/health';

function Dot({ light }: { light: HealthLight }) {
  const color = light === 'green' ? 'bg-emerald-500' : light === 'amber' ? 'bg-amber-400' : 'bg-red-500';
  const ring  = light === 'green' ? 'ring-emerald-500/30' : light === 'amber' ? 'ring-amber-400/30' : 'ring-red-500/30';
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${color} ring-4 ${ring}`} />;
}

function Tiles({ status }: { status: HealthStatus }) {
  const tiles = [
    { label: 'Jito', light: status.jito.light, meta: status.jito.latencyMs ? `${status.jito.latencyMs} ms` : undefined, sub: status.jito.tipFloor != null ? `tip floor ~${Math.round(status.jito.tipFloor)}` : status.jito.message || undefined },
    { label: 'RPC',  light: status.rpc.light,  meta: status.rpc.latencyMs ? `${status.rpc.latencyMs} ms` : undefined,  sub: status.rpc.endpoint?.replace(/^https?:\/\//,'') || status.rpc.message || undefined },
    { label: 'WS',   light: status.ws.light,   meta: status.ws.lastHeartbeatAt ? new Date(status.ws.lastHeartbeatAt).toLocaleTimeString() : undefined, sub: status.ws.missed != null ? (status.ws.missed>0?`missed ${status.ws.missed} hb`:'alive') : status.ws.message || undefined },
    { label: 'SM',   light: status.sm.light,   meta: status.sm.slot ? `slot ${status.sm.slot}` : undefined, sub: status.sm.slotDelta != null ? `Δ ${status.sm.slotDelta}` : status.sm.message || undefined },
  ] as Array<{label:string; light:HealthLight; meta?:string; sub?:string}>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {tiles.map(t=>(
        <div key={t.label} className="rounded-xl border border-zinc-800 p-4 bg-zinc-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Dot light={t.light} />
            <div className="flex flex-col">
              <div className="text-sm font-medium">{t.label}</div>
              {t.sub ? <div className="text-[11px] text-zinc-500 truncate max-w-[32ch]">{t.sub}</div> : null}
            </div>
          </div>
          {t.meta ? <div className="text-xs text-zinc-400">{t.meta}</div> : null}
        </div>
      ))}
    </div>
  );
}

export default function StatusBentoPanel() {
  const { health, loading, error } = useHealth();
  if (loading) return <div className="text-sm text-zinc-500">Loading</div>;
  if (error || !health) return <div className="text-sm text-red-400">Health unavailable</div>;
  return <Tiles status={health} />;
}


