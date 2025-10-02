export function BadgePill(
  { children, tone = 'muted' }:
  { children: React.ReactNode; tone?: 'muted' | 'accent' | 'success' | 'warn' | 'danger' }
) {
  const m = {
    muted: 'bg-zinc-900 text-zinc-300 border-zinc-800',
    accent: 'bg-violet-950/60 text-violet-200 border-violet-900/60',
    success: 'bg-emerald-950/60 text-emerald-200 border-emerald-900/60',
    warn: 'bg-amber-950/60 text-amber-200 border-amber-900/60',
    danger: 'bg-red-950/60 text-red-200 border-red-900/60',
  }[tone];
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${m}`}>
      {children}
    </span>
  );
}

export default BadgePill;


