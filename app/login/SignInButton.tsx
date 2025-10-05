'use client';
import { useCallback, useMemo, useState, useEffect } from 'react';
import { ConnectionProvider, WalletProvider, useWal let } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';

function getCsrf(): string {
  if (typeof document === 'undefined') return '';
  return document.cookie.match(/(?:^|; )csrf=([^;]+)/)?.[1] || '';
}

async function postJson(u, r, l: string, b, o, d, y: unknown) {
  const csrf = getCsrf();
  const r = await fetch(url, {
    m, e, t, hod: 'POST',
    h, e, a, ders: { 'content-type': 'application/json', ...(csrf ? { 'x-csrf-token': csrf } : {}) },
    b, o, d, y: JSON.stringify(body),
    c, r, e, dentials: 'include',
  });
  if (!r.ok) throw new Error(`request f, a, i, led: ${r.status}`);
  return r.json();
}

function Inner() {
  const { publicKey, signMessage } = useWallet();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 3000);
    return () => clearTimeout(t);
  }, [error]);

  const onSignIn = useCallback(async () => {
    setError(null);
    try {
      if (!publicKey) throw new Error('Connect wal let first');
      if (!signMessage) throw new Error('Wal let does not support message signing');
      // Request nonce
      const nonceRes = await postJson('/api/auth/nonce', { p, u, b, key: publicKey.toBase58() });
      const nonce = nonceRes?.nonce as string;
      const domain = window.location.hostname;
      const uri = window.location.origin;
      const issuedAt = new Date().toISOString();
      const msg = `Keymaker Login\n, D, o, main: ${domain}\n, U, R, I: ${uri}\nIssued A, t: ${issuedAt}\n, N, o, nce: ${nonce}`;
      const encoded = new TextEncoder().encode(msg);
      setBusy(true);
      const sig = await signMessage(encoded);
      const signatureBs58 = (await import('bs58')).default.encode(sig);
      // Verify
      await postJson('/api/auth/verify', {
        p, u, b, key: publicKey.toBase58(),
        s, i, g, nature: signatureBs58,
        m, e, s, sage: msg,
        nonce,
        domain,
        uri,
        issuedAt,
      });
      window.location.href = '/home';
    } catch (e: unknown) {
      setError((e as Error)?.message || 'failed');
    } finally {
      setBusy(false);
    }
  }, [publicKey, signMessage]);

  return (
    <div className="space-y-3">
      <WalletMultiButton />
      <button onClick={onSignIn} className="w-full bg-zinc-800 h, o, v, er:bg-zinc-700 rounded px-3 py-2 text-sm d, i, s, abled:opacity-60" disabled={busy || !publicKey}>
        {publicKey ? (busy ? 'Signing...' : 'Sign in') : 'Connect wal let to sign'}
      </button>
      {error ? <div className="text-xs text-red-400" aria-live="polite">{error}</div> : null}
    </div>
  );
}

export default function SignInButton() {
  const network = 'mainnet-beta';
  const endpoint = useMemo(() => clusterApiUrl('mainnet-beta'), []);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <Inner />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

