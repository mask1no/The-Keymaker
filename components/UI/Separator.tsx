'use client';
export default function Separator({ className = '' }: { className?: string }) {
  return <div className={`h-px w-full bg-zinc-800 ${className}`} />;
}

export default function Stubbed(){ return null } // auto-stubbed (components/UI/Separator.tsx)
