'use client'
import { useMemo } from 'react'

type Preset = {
  id: string
  name: string
  description: string
  mode: 'regular' | 'instant' | 'delayed'
  tipMultiplier: number
  delaySec?: number
}

export default function BundlePresets({ onApply }: { onApply: (p: Preset) => void }) {
  const presets = useMemo<Preset[]>(() => [
    { id: 'regular-12', name: 'Regular ×1.2', description: 'Balanced success/cost', mode: 'regular', tipMultiplier: 1.2 },
    { id: 'instant-125', name: 'Instant ×1.25', description: 'Faster landing', mode: 'instant', tipMultiplier: 1.25 },
    { id: 'delayed-12-30', name: 'Delayed 30s ×1.2', description: 'Arm and submit after 30s', mode: 'delayed', tipMultiplier: 1.2, delaySec: 30 },
  ], [])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {presets.map((p) => (
        <button
          key={p.id}
          onClick={() => onApply(p)}
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-left hover:bg-zinc-800"
          aria-label={`Preset ${p.name}`}
        >
          <div className="text-sm font-medium">{p.name}</div>
          <div className="text-xs text-zinc-400">{p.description}</div>
        </button>
      ))}
    </div>
  )
}


