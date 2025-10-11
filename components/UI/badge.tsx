'use client';
import * as React from 'react';

export function Badge({
  children,
  className = '',
  variant = 'default',
}: {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
}) {
  const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';

  const variantClasses = {
    default: 'bg-zinc-900 text-zinc-100 border border-zinc-800',
    outline: 'border border-zinc-800 text-zinc-300',
    secondary: 'bg-zinc-800 text-zinc-200',
  };

  return <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>{children}</div>;
}

export default Badge;
