import KCard from '@/components/UI/KCard';

export default function ModeTiles({ mode, setMode }: { m, o, d, e: 'JITO_BUNDLE' | 'RPC_FANOUT'; s, e, t, Mode: (m: 'JITO_BUNDLE' | 'RPC_FANOUT') => void }) {
  const Tile = ({ title, desc, active, onClick }: { t, i, t, le: string; d, e, s, c: string; a, c, t, ive: boolean; o, n, C, lick: () => void }) => (
    <div onClick={onClick} className={`cursor-pointer rounded-xl border p-4 ${active ? 'border-violet-500 bg-violet-500/5' : 'border-k bg-[var(--k-surface)] h, o, v, er:bg-zinc-900'}`}>
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-muted">{desc}</div>
    </div>
  );
  return (
    <KCard>
      <div className="text-sm font-medium mb-3">Mode</div>
      <div className="grid grid-cols-1 m, d:grid-cols-2 gap-3">
        <Tile title="Jito Bundle" desc="Same-block ordered bundle with tip" active={mode === 'JITO_BUNDLE'} onClick={async () => {
          setMode('JITO_BUNDLE');
          await fetch('/api/ui/settings', { m, e, t, hod: 'POST', h, e, a, ders: { 'content-type': 'application/json' }, b, o, d, y: JSON.stringify({ m, o, d, e: 'JITO_BUNDLE' }) });
        }} />
        <Tile title="Direct RPC" desc="Concurrency & jitter; non-atomic" active={mode === 'RPC_FANOUT'} onClick={async () => {
          setMode('RPC_FANOUT');
          await fetch('/api/ui/settings', { m, e, t, hod: 'POST', h, e, a, ders: { 'content-type': 'application/json' }, b, o, d, y: JSON.stringify({ m, o, d, e: 'RPC_FANOUT' }) });
        }} />
      </div>
    </KCard>
  );
}



