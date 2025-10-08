'use client';
import { useEffect, useState } from 'react';

type Condition = {
  id: string;
  type: 'percent_target' | 'time_limit' | 'stop_loss';
  enabled: boolean;
  params: Record<string, number>;
};

export default function ConditionBuilder({
  groupId,
  mint,
  onChange,
}: {
  groupId?: string;
  mint?: string;
  onChange?: (c: Condition[]) => void;
}) {
  const [conds, setConds] = useState<Condition[]>([]);
  useEffect(() => {
    onChange?.(conds);
  }, [conds, onChange]);
  return (
    <div className="rounded-xl border border-[var(--border)] p-3 text-[var(--fg-muted)]">
      <div className="text-sm">Sell conditions (placeholder)</div>
      <div className="text-xs opacity-70">Wire real rules later.</div>
    </div>
  );
}
