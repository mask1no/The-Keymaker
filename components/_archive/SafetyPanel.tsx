'use client';
import KCard from '@/components/UI/KCard';

export default function SafetyPanel({
  onArm,
  onDisarm,
  armedUntil,
}: {
  onArm: (mins: number) => Promise<void> | void;
  onDisarm: () => Promise<void> | void;
  armedUntil?: string;
}) {
  return (
    <KCard>
      <div className="text-sm font-medium mb-2">Safety</div>
      <div className="flex items-center gap-2">
        <button
          className="bg-zinc-800 hover:bg-zinc-700 rounded px-3 py-2 text-sm"
          onClick={() => onArm(15)}
        >
          Arm 15m
        </button>
        <button
          className="border border-k hover:bg-zinc-900 rounded px-3 py-2 text-sm"
          onClick={onDisarm}
        >
          Disarm
        </button>
        <div className="ml-2 text-xs text-muted">
          {armedUntil ? `Armed until ${armedUntil}` : 'DryRun mode simulates without sending.'}
        </div>
      </div>
    </KCard>
  );
}
