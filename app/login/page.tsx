'use client';
import { useEffect, useState } from 'react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { PublicKey } from '@solana/web3.js';

async function getNonce(): Promise<string> {
  const res = await fetch('/api/auth/nonce', { cache: 'no-store' });
  const j = await res.json();
  if (!res.ok) throw new Error(j?.error || 'failed');
  return j.nonce as string;
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adapter] = useState(() => new PhantomWalletAdapter());

  useEffect(() => {
    try {
      adapter.on('error', () => {});
    } catch {}
  }, [adapter]);

  const onLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!adapter.connected) await adapter.connect();
      const pk = adapter.publicKey as PublicKey | null;
      if (!pk) throw new Error('No public key');
      const pubkey = pk.toBase58();
      const nonce = await getNonce();
      const tsIso = new Date().toISOString();
      const message = `Keymaker-Login|pubkey=${pubkey}|ts=${tsIso}|nonce=${nonce}`;
      const encoded = new TextEncoder().encode(message);
      // @ts-expect-error wallet adapter signMessage is available on Phantom
      const sigBytes: Uint8Array = await adapter.signMessage(encoded);
      const signatureBase64 = Buffer.from(sigBytes).toString('base64');
      const messageBase64 = Buffer.from(encoded).toString('base64');
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pubkey, tsIso, nonce, messageBase64, signatureBase64 }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'failed');
      // Session cookie set httpOnly by server; redirect
      window.location.href = '/engine';
    } catch (e: any) {
      setError(e?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-sm w-full card">
        <div className="label mb-2">Welcome</div>
        <h1 className="text-xl font-semibold mb-4">Login to Keymaker</h1>
        <p className="text-sm text-zinc-400 mb-4">
          Sign a short message with your wallet to continue. No on-chain tx.
        </p>
        <button
          className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg px-3 py-2"
          onClick={onLogin}
          disabled={loading}
        >
          {loading ? 'Signing…' : 'Sign-in with Phantom'}
        </button>
        {error && <div className="text-red-400 text-sm mt-3">{error}</div>}
      </div>
    </div>
  );
}
