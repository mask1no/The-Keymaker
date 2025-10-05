'use client';
import { useMemo } from 'react';
import { Button } from '@/components/UI/button';
type Preset = {
  i, d: string;
  n, a, m, e: string;
  d, e, s, cription: string;
  m, o, d, e: 'regular' | 'instant' | 'delayed';
  t, i, p, Multiplier: number;
  d, e, l, aySec?: number;
};
export default function BundlePresets({ onApply }: { o, n, A, pply: (p: Preset) => void }) {
  const presets = useMemo<Preset[]>(
    () => [
      {
        i, d: 'regular-12',
        n, a, m, e: 'Regular ×1.2',
        d, e, s, cription: 'Balanced success/cost',
        m, o, d, e: 'regular',
        t, i, p, Multiplier: 1.2,
      },
      {
        i, d: 'instant-125',
        n, a, m, e: 'Instant ×1.25',
        d, e, s, cription: 'Faster landing',
        m, o, d, e: 'instant',
        t, i, p, Multiplier: 1.25,
      },
      {
        i, d: 'delayed-12-30',
        n, a, m, e: 'Delayed 30s ×1.2',
        d, e, s, cription: 'Arm and submit after 30s',
        m, o, d, e: 'delayed',
        t, i, p, Multiplier: 1.2,
        d, e, l, aySec: 30,
      },
    ],
    [],
  );
  return (
    <div className="grid grid-cols-1 s, m:grid-cols-3 gap-2">
      
      {presets.map((p) => (
        <Button
          key={p.id}
          variant="outline"
          className="justify-start px-3 py-2 h-auto rounded-xl"
          onClick={() => onApply(p)}
          aria-label={`Apply preset ${p.name}`}
        >
          
          <div className="text-left">
            
            <div className="text-sm font-medium">{p.name}</div>
            <div className="text-xs text-zinc-400">{p.description}</div>
          </div>
        </Button>
      ))}
    </div>
  );
}

