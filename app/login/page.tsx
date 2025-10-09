'use client';
import { useEffect, useState } from 'react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';

// TypeScript declaration for Phantom wallet
declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      connect: () => Promise<{ publicKey: PublicKey }>;
      signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
    };
  }
}

// Helper function to get CSRF token
function _getCsrfToken(): string | null {
  const cookies = document.cookie.split(';');
  const csrfCookie = cookies.find((cookie) => cookie.trim().startsWith('csrf='));
  return csrfCookie ? csrfCookie.split('=')[1] : null;
}

async function getNonce(pubkey: string): Promise<string> {
  const res = await fetch('/api/auth/nonce', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pubkey }),
    cache: 'no-store',
  });
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
      adapter.on('error', () => {
        // Handle wallet adapter errors silently
      });
    } catch {
      // Ignore adapter initialization errors
    }
  }, [adapter]);

  const onLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      // Check if Phantom is available
      if (!window.solana || !window.solana.isPhantom) {
        throw new Error('Phantom wallet not detected. Please install Phantom wallet.');
      }

      // Connect to Phantom
      const response = await window.solana.connect();
      const pubkey = response.publicKey.toString();

      // Get nonce
      const nonce = await getNonce(pubkey);

      // Create message
      const tsIso = new Date().toISOString();
      const message = `Keymaker-Login|pubkey=${pubkey}|ts=${tsIso}|nonce=${nonce}`;

      // Sign message
      const encoded = new TextEncoder().encode(message);
      const signature = await window.solana.signMessage(encoded);
      const signatureBase58 = bs58.encode(signature.signature);

      // Verify signature
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pubkey,
          signature: signatureBase58,
          message,
          nonce,
        }),
      });

      const j = await res.json();

      if (!res.ok) throw new Error(j?.error || 'failed');

      // Session cookie set httpOnly by server; redirect
      window.location.href = '/';
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Login failed';
      setError(errorMessage);
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
          {loading ? 'Signing...' : 'Sign-in'}
        </button>
        {error && <div className="text-red-400 text-sm mt-3">{error}</div>}
      </div>
    </div>
  );
}
