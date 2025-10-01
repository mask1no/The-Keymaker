'use client';

import { useEffect, useMemo, useState } from 'react';

type Provider = {
  name: string;
  icon?: string;
  connect: () => Promise<string>;
  signMessage: (msg: Uint8Array) => Promise<Uint8Array>;
};

const te = new TextEncoder();
const toU8 = (s: string) => te.encode(s);
const toB58 = (u8: Uint8Array) => {
  // Avoid exposing in global; lazy import not allowed in client hook here
  // Use base58 encoding via a minimal inline implementation
  // For compatibility, we will use window.btoa on hex and let server handle b58 if provided
  // But SIWS server expects base58; implement a simple base58 with alphabet
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const bytes = Array.from(u8);
  let zeros = 0;
  for (const b of bytes) {
    if (b === 0) zeros++; else break;
  }
  const carryArr = [...bytes];
  const encoded: string[] = [];
  while (carryArr.length && carryArr.some((b) => b !== 0)) {
    let remainder = 0;
    const next: number[] = [];
    for (const byte of carryArr) {
      const acc = (remainder << 8) + byte;
      const div = Math.floor(acc / 58);
      remainder = acc % 58;
      if (next.length || div !== 0) next.push(div);
    }
    encoded.push(ALPHABET[remainder]);
    carryArr.splice(0, carryArr.length, ...next);
  }
  for (let i = 0; i < zeros; i++) encoded.push('1');
  return encoded.reverse().join('');
};

function detectProviders(): Provider[] {
  const out: Provider[] = [];
  const w = globalThis as Record<string, unknown>;
  const push = (name: string, obj: Record<string, unknown> | undefined | null) => {
    if (!obj) return;
    const connect = async () => {
      if (typeof (obj as any).connect === 'function') {
        const res = await (obj as any).connect();
        const pk =
          (obj as any).publicKey?.toBase58?.() ??
          res?.publicKey?.toBase58?.() ??
          res?.publicKey ??
          (obj as any).publicKey?.toString?.();
        if (!pk) throw new Error(`${name} connect returned no public key`);
        return pk;
      }
      const pk = (obj as any).publicKey?.toBase58?.() ?? (obj as any).publicKey?.toString?.();
      if (!pk) throw new Error(`${name} not connected`);
      return pk;
    };
    const signMessage = async (msg: Uint8Array) => {
      if (typeof (obj as any).signMessage === 'function') {
        const sig = await (obj as any).signMessage(msg, 'utf8');
        if (sig?.signature) return new Uint8Array(sig.signature);
        if (sig instanceof Uint8Array) return sig;
        if (sig?.signature?.length) return new Uint8Array(sig.signature);
        throw new Error(`${name} signMessage returned unexpected shape`);
      }
      if (typeof (obj as any).request === 'function') {
        const res = await (obj as any).request({
          method: 'signMessage',
          params: { message: Array.from(msg) },
        });
        const sig = res?.signature ?? res?.result ?? res;
        return new Uint8Array(sig);
      }
      throw new Error(`${name} does not support signMessage`);
    };
    out.push({ name, connect, signMessage, icon: (obj as any).icon ?? undefined });
  };

  try {
    const std: any = (w as any)['wallets'] ?? (w as any)['@wallet-standard/app'];
    if (std?.get) {
      for (const wal of std.get()) {
        if (wal?.chains?.some((c: string) => c.includes('solana'))) push(wal.name || 'Wallet', wal);
      }
    }
  } catch (_err) {
    // Swallow wallet standard detection errors; fall back to direct injections.
  }

  const solana = (w as any).solana;
  if (solana?.isPhantom) push('Phantom', solana);
  const phantom = (w as any).phantom?.solana;
  if (phantom?.isPhantom) push('Phantom', phantom);
  const backpack = (w as any).backpack?.solana;
  if (backpack) push('Backpack', backpack);
  const solflare = (w as any).solflare;
  if (solflare?.isSolflare) push('Solflare', solflare);
  const nightly = (w as any).nightly?.solana;
  if (nightly) push('Nightly', nightly);
  if (solana && !out.length) push('Solana', solana);
  // Auto-connect if Phantom is authorized previously

  const seen = new Set<string>();
  return out.filter((p) => (seen.has(p.name) ? false : (seen.add(p.name), true)));
}

// Mock wallet provider for development/testing
function getMockProvider(): Provider {
  return {
    name: 'Mock Wallet (Dev Only)',
    icon: '/favicon.ico',
    connect: async () => {
      console.log('[MOCK] Connecting mock wallet...');
      const mockPubkey = 'Mock' + Math.random().toString(36).slice(2, 15);
      return mockPubkey;
    },
    signMessage: async (message: Uint8Array) => {
      console.log('[MOCK] Signing message:', message.length, 'bytes');
      // Return mock signature (64 bytes)
      return new Uint8Array(64).fill(1);
    }
  };
}

export default function SignInButton() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [choiceOpen, setChoiceOpen] = useState(false);
  const [busy, setBusy] = useState<null | string>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[AUTH] Starting wallet detection...');
    
    // Small delay to let window fully load
    setTimeout(() => {
      const detected = detectProviders();
      console.log('[AUTH] Detected wallets:', detected.length, detected.map(p => p.name));
      
      if (detected.length > 0) {
        // Found real wallet extensions
        console.log('[AUTH] Using real wallets:', detected.map(p => p.name).join(', '));
        setProviders(detected);
        setLoading(false);
      } else {
        // No wallets detected - add mock wallet immediately for testing
        console.log('[AUTH] No real wallets found, adding mock wallet');
        const mockWallet = getMockProvider();
        setProviders([mockWallet]);
        setLoading(false);
        
        // Also retry detection in case wallet loads late
        const timeout = setTimeout(() => {
          const retryDetected = detectProviders();
          if (retryDetected.length > 0) {
            console.log('[AUTH] Wallets detected on retry:', retryDetected.length);
            // Replace mock with real wallets if found
            setProviders(retryDetected);
          }
        }, 2000);
        return () => clearTimeout(timeout);
      }
    }, 100);
  }, []);
  const single = useMemo(() => (providers.length === 1 ? providers[0] : null), [providers]);

  // idle → connecting → walletConnected → verifying → ready
  async function runSignIn(p: Provider) {
    console.log('[AUTH] ===== STARTING SIGN IN =====');
    console.log('[AUTH] Provider:', p.name);
    
    setErr(null);
    try {
      console.log('[AUTH] Step 1: Connecting wallet...');
      setBusy('Connecting wallet...');
      
      const address = await p.connect();
      console.log('[AUTH] Connected! Address:', address);

      console.log('[AUTH] Step 2: Fetching nonce...');
      setBusy('Fetching nonce...');
      
      const nonceRes = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pubkey: address }),
      });
      
      console.log('[AUTH] Nonce response status:', nonceRes.status);
      if (!nonceRes.ok) {
        const errorText = await nonceRes.text();
        console.error('[AUTH] Nonce error:', errorText);
        throw new Error(`Failed to get nonce: ${nonceRes.status}`);
      }
      
      const { nonce } = await nonceRes.json();
      console.log('[AUTH] Nonce received:', nonce);

      const issuedAt = new Date().toISOString();
      const host = window.location.host;
      const origin = window.location.origin;
      const message =
        `Keymaker wants you to sign in with your Solana wallet.\n` +
        `Address: ${address}\nDomain: ${host}\nURI: ${origin}\nNonce: ${nonce}\nIssued At: ${issuedAt}`;

      console.log('[AUTH] Step 3: Requesting signature...');
      setBusy('Awaiting signature...');
      
      const signature = await p.signMessage(toU8(message));
      console.log('[AUTH] Signature received:', signature.length, 'bytes');

      console.log('[AUTH] Step 4: Verifying signature...');
      setBusy('Verifying...');
      
      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          pubkey: address,
          signature: toB58(signature),
          message,
          nonce,
          domain: host,
          uri: origin,
          issuedAt,
        }),
      });
      console.log('[AUTH] Verify response status:', verifyRes.status);
      
      if (!verifyRes.ok) {
        const j = await verifyRes.json().catch(() => ({}));
        console.error('[AUTH] Verification failed:', j);
        throw new Error(`Verification failed (${verifyRes.status}): ${j.error || 'Unknown error'}`);
      }
      
      const verifyData = await verifyRes.json();
      console.log('[AUTH] ===== AUTHENTICATION SUCCESSFUL =====');
      console.log('[AUTH] Session data:', verifyData);
      console.log('[AUTH] Redirecting to /engine...');
      
      window.location.href = '/engine?signed=1';
    } catch (e: any) {
      console.error('[AUTH] ===== SIGN IN FAILED =====');
      console.error('[AUTH] Error:', e);
      setErr(e?.message || String(e));
      setBusy(null);
    }
  }

  const handleClick = () => {
    console.log('[AUTH] ===== BUTTON CLICKED =====');
    console.log('[AUTH] Providers available:', providers.length);
    console.log('[AUTH] Provider details:', providers.map(p => p.name));
    console.log('[AUTH] Single provider:', single?.name);
    console.log('[AUTH] Busy state:', busy);
    
    if (providers.length === 0) {
      console.error('[AUTH] No providers found!');
      setErr('No wallet detected. Please install Phantom, Backpack, or another Solana wallet.');
      return;
    }
    
    if (single) {
      console.log('[AUTH] Starting sign in with single provider:', single.name);
      runSignIn(single);
      return;
    }
    
    if (providers.length > 1) {
      console.log('[AUTH] Multiple wallets, showing choice dialog');
      setChoiceOpen(true);
      return;
    }
    
    console.warn('[AUTH] Reached end of handleClick without action');
  };

  if (loading) {
    return (
      <div className="px-5 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-center">
        <div className="text-sm text-zinc-400">Detecting wallets...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Debug info */}
      {providers.length > 0 && (
        <div className="text-xs text-zinc-500">
          {providers.length} wallet{providers.length > 1 ? 's' : ''} detected: {providers.map(p => p.name).join(', ')}
        </div>
      )}
      
      <button
        onClick={handleClick}
        className="px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-700 cursor-pointer"
        disabled={!!busy}
      >
        {busy ? busy : 'Sign in with your wallet'}
      </button>

      {err && <div className="text-sm text-red-400">{err}</div>}

      {choiceOpen && (
        <div
          role="dialog"
          aria-modal
          className="fixed inset-0 bg-black/60 flex items-center justify-center"
        >
          <div className="bg-zinc-900 rounded-2xl p-4 w-[320px] border border-zinc-700">
            <div className="text-zinc-100 font-semibold mb-2">Choose a wallet</div>
            <div className="flex flex-col gap-2">
              {providers.map((p) => (
                <button
                  key={p.name + Math.random()}
                  onClick={() => {
                    setChoiceOpen(false);
                    void runSignIn(p);
                  }}
                  className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-left"
                >
                  {p.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => setChoiceOpen(false)}
              className="mt-3 text-xs text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
