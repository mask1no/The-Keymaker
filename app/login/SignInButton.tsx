'use client';
import { useCallback, useMemo, useState, useEffect } from 'react';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { loadClientEnv } from '@/lib/env/client';
import '@solana/wallet-adapter-react-ui/styles.css';

function getCsrf(): string {
  if (typeof document === 'undefined') return '';
  return document.cookie.match(/(?:^|; )csrf=([^;]+)/)?.[1] || '';
}

async function postJson(url: string, body: unknown) {
  const csrf = getCsrf();
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(csrf ? { 'x-csrf-token': csrf } : {}) },
    body: JSON.stringify(body),
    credentials: 'include',
  });
  if (!r.ok) throw new Error(`request failed: ${r.status}`);
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
      if (!publicKey) throw new Error('Connect wallet first');
      if (!signMessage) throw new Error('Wallet does not support message signing');
      // Request nonce
      const nonceRes = await postJson('/api/auth/nonce', { pubkey: publicKey.toBase58() });
      const nonce = nonceRes?.nonce as string;
      const domain = window.location.hostname;
      const uri = window.location.origin;
      const issuedAt = new Date().toISOString();
      const msg = `Keymaker Login\nDomain: ${domain}\nURI: ${uri}\nIssued At: ${issuedAt}\nNonce: ${nonce}`;
      const encoded = new TextEncoder().encode(msg);
      setBusy(true);
      const sig = await signMessage(encoded);
      const signatureBs58 = (await import('bs58')).default.encode(sig);
      // Verify
      await postJson('/api/auth/verify', {
        pubkey: publicKey.toBase58(),
        signature: signatureBs58,
        message: msg,
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
      <button
        onClick={onSignIn}
        className="w-full rounded px-3 py-2 text-sm disabled:opacity-60 bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]"
        disabled={busy || !publicKey}
      >
        {publicKey ? (busy ? 'Signing' : 'Sign in') : 'Connect wallet to sign'}
      </button>
      {error ? (
        <div className="text-xs text-red-400" aria-live="polite">
          {error}
        </div>
      ) : null}
    </div>
  );
}

export default function SignInButton() {
  const network = 'mainnet-beta';
  const { NEXT_PUBLIC_HELIUS_RPC } = loadClientEnv();
  const endpoint = useMemo(
    () => NEXT_PUBLIC_HELIUS_RPC || clusterApiUrl('mainnet-beta'),
    [NEXT_PUBLIC_HELIUS_RPC],
  );
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
