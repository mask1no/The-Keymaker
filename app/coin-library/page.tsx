export const dynamic = 'force-dynamic';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDraftStore } from '@/stores/useDraftStore';

type Draft = {
  name: string;
  symbol: string;
  image: string;
  description?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
};

export default function CoinLibraryPage() {
  const [mint, setMint] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraftLocal] = useState<Draft | null>(null);
  const setDraft = useDraftStore((s) => s.setDraft);
  const router = useRouter();

  async function fetchMeta(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/token/${encodeURIComponent(mint)}/meta`, { cache: 'no-store' });
      if (!res.ok) throw new Error(await res.text());
      const j = await res.json();
      setDraftLocal(j.draft as Draft);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }

  function copyToCoin() {
    if (!draft) return;
    setDraft(draft);
    router.push('/coin');
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
        <h1 className="text-xl font-semibold">Coin Library</h1>
        <p className="text-sm text-muted-foreground">Paste a contract address (mint), preview metadata, and prefill Coin.</p>
        <form onSubmit={fetchMeta} className="mt-4 flex items-center gap-2">
          <input
            value={mint}
            onChange={(e) => setMint(e.target.value)}
            placeholder="Mint address"
            className="bg-zinc-900 border border-zinc-800 rounded px-3 py-2 w-full max-w-xl"
          />
          <button disabled={loading || !mint} className="bg-zinc-800 hover:bg-zinc-700 rounded px-3 py-2 text-sm" type="submit">
            {loading ? 'Loading…' : 'Fetch'}
          </button>
        </form>
        {error && <div className="mt-2 text-sm text-red-400">{error}</div>}
        {draft && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="border border-zinc-800 rounded overflow-hidden">
              {draft.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.image} alt={draft.symbol} className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-zinc-900" />
              )}
              <div className="p-3">
                <div className="font-medium">{draft.name} <span className="text-xs text-zinc-400">{draft.symbol}</span></div>
                {draft.description && <div className="mt-1 text-xs text-zinc-400 line-clamp-3">{draft.description}</div>}
                <div className="mt-2 flex gap-2 text-xs text-sky-400">
                  {draft.website && <a className="hover:underline" href={draft.website} target="_blank" rel="noreferrer">Website</a>}
                  {draft.twitter && <a className="hover:underline" href={draft.twitter} target="_blank" rel="noreferrer">Twitter</a>}
                  {draft.telegram && <a className="hover:underline" href={draft.telegram} target="_blank" rel="noreferrer">Telegram</a>}
                </div>
                <div className="mt-3">
                  <button onClick={copyToCoin} className="bg-sky-700 hover:bg-sky-600 rounded px-3 py-2 text-sm">
                    Copy to Coin
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


