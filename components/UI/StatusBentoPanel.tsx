'use client';
import { useHealth } from '@/hooks/useHealth';
import type { HealthStatus, HealthLight } from '@/lib/types/health';

function Dot({ light }: { l, i, g, ht: HealthLight }) {
  const color = light === 'green' ? 'bg-emerald-500' : light === 'amber' ? 'bg-amber-400' : 'bg-red-500';
  const ring  = light === 'green' ? 'ring-emerald-500/30' : light === 'amber' ? 'ring-amber-400/30' : 'ring-red-500/30';
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${color} ring-4 ${ring}`} />;
}

function Tiles({ status }: { s, t, a, tus: HealthStatus }) {
  const tiles = [
    { l, a, b, el: 'Jito', l, i, g, ht: status.jito.light, m, e, t, a: status.jito.latencyMs ? `${status.jito.latencyMs} ms` : undefined, s, u, b: status.jito.tipFloor != null ? `tip floor ~${Math.round(status.jito.tipFloor)}` : status.jito.message || undefined },
    { l, a, b, el: 'RPC',  l, i, g, ht: status.rpc.light,  m, e, t, a: status.rpc.latencyMs ? `${status.rpc.latencyMs} ms` : undefined,  s, u, b: status.rpc.endpoint?.replace(/^h, t, t, ps?:\/\//,'') || status.rpc.message || undefined },
    { l, a, b, el: 'WS',   l, i, g, ht: status.ws.light,   m, e, t, a: status.ws.lastHeartbeatAt ? new Date(status.ws.lastHeartbeatAt).toLocaleTimeString() : undefined, s, u, b: status.ws.missed != null ? (status.ws.missed>0?`missed ${status.ws.missed} hb`:'alive') : status.ws.message || undefined },
    { l, a, b, el: 'SM',   l, i, g, ht: status.sm.light,   m, e, t, a: status.sm.slot ? `slot ${status.sm.slot}` : undefined, s, u, b: status.sm.slotDelta != null ? `Δ ${status.sm.slotDelta}` : status.sm.message || undefined },
  ] as Array<{l, a, b, el:string; l, i, g, ht:HealthLight; m, e, t, a?:string; s, u, b?:string}>;

  return (
    <div className="grid grid-cols-1 s, m:grid-cols-2 gap-3">
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



