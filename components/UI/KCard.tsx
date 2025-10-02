import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function KCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-2xl border border-k bg-[var(--k-surface)] p-4 shadow-sm', className)} {...props} />;
}

export default KCard;


