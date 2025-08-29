"use client"
import useSWR from 'swr'

type HealthState = 'healthy' | 'degraded' | 'down'

function colorFor(state: HealthState) {
  return state === 'healthy'
    ? 'bg-green-500'
    : state === 'degraded'
      ? 'bg-amber-500'
      : 'bg-red-500'
}

export function StatusCluster() {
  const { data } = useSWR('/api/health', (u) => fetch(u).then((r) => r.json()), {
    refreshInterval: 3000,
  })

  const rpc: HealthState = ((): HealthState => {
    const v = data?.rpc
    if (v === true || v === 'healthy') return 'healthy'
    if (v === 'degraded') return 'degraded'
    return 'down'
  })()

  const be: HealthState = ((): HealthState => {
    const v = data?.be ?? data?.jito
    if (v === true || v === 'healthy') return 'healthy'
    if (v === 'degraded') return 'degraded'
    return 'down'
  })()

  const ws: HealthState = 'healthy'

  const Cell = ({ label, state }: { label: string; state: HealthState }) => (
    <div className="rounded-xl border border-white/10 p-2 pr-3 flex items-center gap-2 text-xs">
      <div className={`h-2.5 w-2.5 rounded-full ${colorFor(state)}`} />
      <div className="text-white/80">{label}</div>
    </div>
  )

  return (
    <div className="grid grid-cols-3 gap-2 w-full max-w-sm">
      <Cell label="RPC" state={rpc} />
      <Cell label="WS" state={ws} />
      <Cell label="Jito" state={be} />
    </div>
  )
}
