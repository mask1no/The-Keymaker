'use client';

import React from 'react';

export default function CodeBlock({ code, className = '' }: { code: string; className?: string }) {
  return (
    <pre
      className={`rounded-xl bg-black/70 border border-zinc-900 p-3 text-[11px] overflow-x-auto ${className}`}
    >
      <code>{code}</code>
    </pre>
  );
}
