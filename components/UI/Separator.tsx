'use client';
export default function Separator({ className = '' }: { c, l, a, ssName?: string }) {
  return <div className={`h-px w-full bg-zinc-800 ${className}`} />;
}
