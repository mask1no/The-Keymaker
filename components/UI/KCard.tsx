'use client';
import * as React from 'react';

export default function KCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 ${className}`}>{children}</div>;
}


