'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Buffer } from 'buffer';

type DetectedWallet = {
  id: string;
  name: string;
  icon?: string;
  provider: any;
};

async function getNonce(): Promise<string> {
  const res = await fetch('/api/auth/nonce', { cache: 'no-store' });
  const j = await res.json();
  if (!res.ok) throw new Error(j?.error || 'failed');
  return j.nonce as string;
}

function detectWallets(): DetectedWallet[] {
  if (typeof window === 'undefined') return [];
  const w: any = window as any;
  const list: DetectedWallet[] = [];
  const push = (id: string, name: string, provider: any, icon?: string) => {
    if (!provider) return;
    if (list.some((x) => x.provider === provider)) return;
    list.push({ id, name, provider, icon });
  };
  // Wallet Standard (lazy / optional)
  try {
    const standard = (w as any)['wallets'] || (w as any)['@wallet-standard/app'];
    const accounts = standard?.get()?.wallets || [];
    for (const acct of accounts) {
      push(
        acct.name?.toLowerCase?.() || acct.name || 'standard',
        acct.name || 'Wallet',
        acct,
        acct.icon,
      );
    }
  } catch (_e) {
    // ignore wallet-standard absence
  }
  // Common injections
  push('phantom', 'Phantom', w.phantom?.solana || (w.solana?.isPhantom ? w.solana : null));
  push(
    'backpack',
    'Backpack',
    w.backpack?.solana || (w.solana?.isBackpack ? w.solana : w.xnft?.solana),
  );
  push('solflare', 'Solflare', w.solflare || (w.solana?.isSolflare ? w.solana : null));
  push('nightly', 'Nightly', w.nightly?.solana || (w.solana?.isNightly ? w.solana : null));
  // Fallback generic
  push('solana', 'Detected Wallet', w.solana);
  return list.filter((x) => !!x.provider);
}

export default function SignInButton() {
  const [wallets, setWallets] = useState<DetectedWallet[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<'idle' | 'detect' | 'connect' | 'sign' | 'verify'>('idle');
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      // Ensure Buffer exists in browser
      if (typeof window !== 'undefined' && !(window as any).Buffer)
        (window as any).Buffer = Buffer as any;
    } catch (_e) {
      // ignore
    }
    setLoading('detect');
    const list = detectWallets();
    setWallets(list);
    setLoading('idle');
  }, []);

  const doSignIn = useCallback(async (prov: any) => {
    setError(null);
    setLoading('connect');
    try {
      if (!prov?.isConnected) await prov.connect?.();
      const pk = prov?.publicKey;
      const address = pk?.toBase58?.();
      if (!address) throw new Error('Wallet not connected');
      setLoading('sign');
      const nonce = await getNonce();
      const tsIso = new Date().toISOString();
      // Match server's canonical login message exactly
      const message = `Keymaker-Login|pubkey=${address}|ts=${tsIso}|nonce=${nonce}`;
      const bytes = new TextEncoder().encode(message);
      // Some wallets only accept Uint8Array without encoding arg
      const res = await prov.signMessage?.(bytes);
      const sigAny: any = res?.signature ?? res;
      let sig: Uint8Array | null = null;
      if (sigAny instanceof Uint8Array) sig = sigAny;
      else if (Array.isArray(sigAny)) sig = new Uint8Array(sigAny);
      else if (typeof sigAny === 'string') sig = Buffer.from(sigAny, 'base64');
      if (!sig) throw new Error('Signature rejected');
      setLoading('verify');
      const verify = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pubkey: address,
          tsIso,
          nonce,
          messageBase64: Buffer.from(bytes).toString('base64'),
          signatureBase64: Buffer.from(sig).toString('base64'),
        }),
      });
      const j = await verify.json().catch(() => ({}));
      if (!verify.ok) throw new Error(j?.error || 'Verification failed');
      window.location.href = '/engine?signed=1';
    } catch (e: unknown) {
      setError((e as Error)?.message || 'Login failed');
      setOpen(false);
      setLoading('idle');
    }
  }, []);

  const onClick = useCallback(() => {
    setError(null);
    if (wallets.length === 1) {
      doSignIn(wallets[0].provider);
      return;
    }
    if (wallets.length > 1) {
      setOpen(true);
      return;
    }
    setError('No wallet found. Install Phantom, Backpack, Solflare, or Nightly.');
  }, [wallets, doSignIn]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'Enter' && wallets.length) doSignIn(wallets[0].provider);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, wallets, doSignIn]);

  return (
    <div>
      <button
        className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg px-3 py-2"
        onClick={onClick}
        disabled={loading !== 'idle'}
      >
        {loading === 'detect' && 'Detecting…'}
        {loading === 'connect' && 'Connecting…'}
        {loading === 'sign' && 'Awaiting signature…'}
        {loading === 'verify' && 'Verifying…'}
        {loading === 'idle' && 'Sign in with your wallet'}
      </button>
      {error && <div className="text-red-400 text-sm mt-3">{error}</div>}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-xl"
          >
            <div className="text-sm text-zinc-400 mb-3">Choose a wallet</div>
            <div className="space-y-2">
              {wallets.map((w) => (
                <button
                  key={w.id}
                  className="w-full text-left bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg px-3 py-2 flex items-center gap-2"
                  onClick={() => doSignIn(w.provider)}
                >
                  {w.icon && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={w.icon} alt="" className="h-5 w-5 rounded" />
                  )}
                  <span>{w.name}</span>
                </button>
              ))}
            </div>
            <div className="mt-3 text-xs text-zinc-500">
              Press Enter to select the first wallet, or ESC to cancel.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
