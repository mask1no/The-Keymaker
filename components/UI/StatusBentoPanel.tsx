'use client';
import { useHealth } from '@/hooks/useHealth';
import { StatusBento } from './StatusBento';

export default function StatusBentoPanel() {
  const { health } = useHealth();
  if (!health) return <div className="text-sm text-zinc-500">Loading…</div>;
  return <StatusBento status={health} />;
}


