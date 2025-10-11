'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/UI/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card';
import { Badge } from '@/components/UI/badge';
import { buildLoginMessage } from '@/lib/auth/siwsMessage';
import bs58 from 'bs58';

interface WalletInfo {
  name: string;
  icon: string;
  detected: boolean;
  connect: () => Promise<void>;
}

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      connect: () => Promise<{ publicKey: any }>;
      signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
    };
    backpack?: {
      connect: () => Promise<{ publicKey: any }>;
      signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
    };
  }
}

export default function WalletConnector() {
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);

  useEffect(() => {
    const detectWallets = () => {
      const detectedWallets: WalletInfo[] = [];

      // Check for wallet adapters (more reliable than direct window checks)
      if (typeof window !== 'undefined') {
        // Phantom Wallet - check if adapter is available
        try {
          const phantomAdapter =
            new (require('@solana/wallet-adapter-wallets').PhantomWalletAdapter)();
          if (phantomAdapter && phantomAdapter.readyState !== 'NotDetected') {
            detectedWallets.push({
              name: 'Phantom',
              icon: '👻',
              detected: true,
              connect: async () => {
                try {
                  setLoading(true);
                  setError(null);

                  const response = await phantomAdapter.connect();
                  const pubkey = response.publicKey.toString();

                  // Get nonce
                  const nonceRes = await fetch('/api/auth/nonce', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pubkey }),
                  });
                  const nonceData = await nonceRes.json();
                  if (!nonceRes.ok) throw new Error(nonceData?.error || 'Failed to get nonce');

                  // Create and sign message
                  const tsIso = new Date().toISOString();
                  const message = buildSIWSMessage({
                    pubkey,
                    nonce: nonceData.nonce,
                    ts: tsIso,
                  });
                  const encoded = new TextEncoder().encode(message);
                  const signature = await phantomAdapter.signMessage(encoded);
                  const signatureBase58 = bs58.encode(signature.signature);

                  // Verify signature
                  const verifyRes = await fetch('/api/auth/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      pubkey,
                      signature: signatureBase58,
                      message,
                      nonce: nonceData.nonce,
                    }),
                  });

                  const verifyData = await verifyRes.json();
                  if (!verifyRes.ok) throw new Error(verifyData?.error || 'Verification failed');

                  setConnectedWallet('Phantom');
                  window.location.href = '/';
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Connection failed');
                } finally {
                  setLoading(false);
                }
              },
            });
          }
        } catch (error) {
          // Phantom adapter not available
        }

        // Backpack Wallet - check if adapter is available
        try {
          const backpackAdapter =
            new (require('@solana/wallet-adapter-wallets').BackpackWalletAdapter)();
          if (backpackAdapter && backpackAdapter.readyState !== 'NotDetected') {
            detectedWallets.push({
              name: 'Backpack',
              icon: '🎒',
              detected: true,
              connect: async () => {
                try {
                  setLoading(true);
                  setError(null);

                  const response = await backpackAdapter.connect();
                  const pubkey = response.publicKey.toString();

                  // Get nonce
                  const nonceRes = await fetch('/api/auth/nonce', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pubkey }),
                  });
                  const nonceData = await nonceRes.json();
                  if (!nonceRes.ok) throw new Error(nonceData?.error || 'Failed to get nonce');

                  // Create and sign message
                  const tsIso = new Date().toISOString();
                  const message = buildSIWSMessage({
                    pubkey,
                    nonce: nonceData.nonce,
                    ts: tsIso,
                  });
                  const encoded = new TextEncoder().encode(message);
                  const signature = await backpackAdapter.signMessage(encoded);
                  const signatureBase58 = bs58.encode(signature.signature);

                  // Verify signature
                  const verifyRes = await fetch('/api/auth/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      pubkey,
                      signature: signatureBase58,
                      message,
                      nonce: nonceData.nonce,
                    }),
                  });

                  const verifyData = await verifyRes.json();
                  if (!verifyRes.ok) throw new Error(verifyData?.error || 'Verification failed');

                  setConnectedWallet('Backpack');
                  window.location.href = '/';
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Connection failed');
                } finally {
                  setLoading(false);
                }
              },
            });
          }
        } catch (error) {
          // Backpack adapter not available
        }
      }

      setWallets(detectedWallets);
    };

    detectWallets();
  }, []);

  if (wallets.length === 0) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">No Wallets Detected</CardTitle>
          <CardDescription className="text-center">
            Please install Phantom or Backpack wallet extension
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>Install one of these wallets to continue:</p>
            <div className="flex justify-center gap-4 mt-2">
              <a
                href="https://phantom.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                👻 Phantom
              </a>
              <a
                href="https://backpack.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                🎒 Backpack
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Connect Wallet</CardTitle>
        <CardDescription className="text-center">
          Choose your wallet to sign in to Keymaker
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          {wallets.map((wallet) => (
            <Button
              key={wallet.name}
              onClick={wallet.connect}
              disabled={loading}
              className="w-full h-16 flex items-center justify-center gap-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800"
            >
              <span className="text-2xl">{wallet.icon}</span>
              <div className="flex flex-col items-start">
                <span className="font-medium">{wallet.name}</span>
                <Badge variant="outline" className="text-xs">
                  Detected
                </Badge>
              </div>
            </Button>
          ))}
        </div>

        {loading && (
          <div className="text-center text-sm text-muted-foreground">
            <p>Connecting to wallet...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
