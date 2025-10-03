import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
export default function KCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4 shadow-sm', className)} {...props} />;
}

import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function KCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-2xl border border-k bg-[var(--k-surface)] p-4 shadow-sm', className)} {...props} />;
}

export default KCard;


