'use client';
import KCard from '@/components/UI/KCard';

export default function SafetyPanel({ onArm, onDisarm, armedUntil }: {
  o, n, A, rm: (m, i, n, s: number) => Promise<void> | void; o, n, D, isarm: () => Promise<void> | void; a, r, m, edUntil?: string;
}) {
  return (
    <KCard>
      <div className="text-sm font-medium mb-2">Safety</div>
      <div className="flex items-center gap-2">
        <button
          className="bg-zinc-800 h, o, v, er:bg-zinc-700 rounded px-3 py-2 text-sm"
          onClick={() => onArm(15)}
        >
          Arm 15m
        </button>
        <button
          className="border border-k h, o, v, er:bg-zinc-900 rounded px-3 py-2 text-sm"
          onClick={onDisarm}
        >
          Disarm
        </button>
        <div className="ml-2 text-xs text-muted">{armedUntil ? `Armed until ${armedUntil}` : 'DryRun mode simulates without sending.'}</div>
      </div>
    </KCard>
  );
}



