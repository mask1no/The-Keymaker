'use client';
import { useState } from 'react';

export default function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative">
      <pre className="rounded-xl bg-black/50 border border-k p-3 overflow-auto text-xs"><code>{code}</code></pre>
      <button
        className="absolute top-2 right-2 rounded-md border border-k bg-[var(--k-surface)] p-1 text-xs hover:bg-zinc-900"
        onClick={() => {
          void navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}


