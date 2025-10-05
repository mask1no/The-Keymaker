import KCard from '@/components/UI/KCard';

export default function ModeTiles({ mode, setMode }: { mode: 'JITO_BUNDLE' | 'RPC_FANOUT'; setMode: (m: 'JITO_BUNDLE' | 'RPC_FANOUT') => void }) {
  const Tile = ({ title, desc, active, onClick }: { title: string; desc: string; active: boolean; onClick: () => void }) => (
    <div onClick={onClick} className={`cursor-pointer rounded-xl border p-4 ${active ? 'border-violet-500 bg-violet-500/5' : 'border-k bg-[var(--k-surface)] hover:bg-zinc-900'}`}>
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-muted">{desc}</div>
    </div>
  );
  return (
    <KCard>
      <div className="text-sm font-medium mb-3">Mode</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Tile title="Jito Bundle" desc="Same-block ordered bundle with tip" active={mode === 'JITO_BUNDLE'} onClick={async () => {
          setMode('JITO_BUNDLE');
          await fetch('/api/ui/settings', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'JITO_BUNDLE' }) });
        }} />
        <Tile title="Direct RPC" desc="Concurrency & jitter; non-atomic" active={mode === 'RPC_FANOUT'} onClick={async () => {
          setMode('RPC_FANOUT');
          await fetch('/api/ui/settings', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'RPC_FANOUT' }) });
        }} />
      </div>
    </KCard>
  );
}



