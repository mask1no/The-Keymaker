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
const toB64 = (u8: Uint8Array) => btoa(String.fromCharCode(...u8));

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

  const seen = new Set<string>();
  return out.filter((p) => (seen.has(p.name) ? false : (seen.add(p.name), true)));
}

export default function SignInButton() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [choiceOpen, setChoiceOpen] = useState(false);
  const [busy, setBusy] = useState<null | string>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setProviders(detectProviders());
  }, []);
  const single = useMemo(() => (providers.length === 1 ? providers[0] : null), [providers]);

  async function runSignIn(p: Provider) {
    setErr(null);
    try {
      setBusy('Connecting wallet');
      const address = await p.connect();

      setBusy('Fetching nonce');
      const nonceRes = await fetch('/api/auth/nonce', { credentials: 'include' });
      if (!nonceRes.ok) throw new Error(`nonce ${nonceRes.status}`);
      const { nonce } = await nonceRes.json();

      const issuedAt = new Date().toISOString();
      const host = window.location.host;
      const origin = window.location.origin;
      const message =
        `Keymaker wants you to sign in with your Solana wallet.\n` +
        `Address: ${address}\nDomain: ${host}\nURI: ${origin}\nNonce: ${nonce}\nIssued At: ${issuedAt}`;

      setBusy('Awaiting signature');
      const signature = await p.signMessage(toU8(message));

      setBusy('Verifying');
      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          // server accepts both schemas; use new
          address,
          signature: toB64(signature),
          message,
          nonce,
          domain: host,
          uri: origin,
          issuedAt,
        }),
      });
      if (!verifyRes.ok) {
        const j = await verifyRes.json().catch(() => ({}));
        throw new Error(`verify ${verifyRes.status}: ${j.error || 'failed'}`);
      }
      window.location.href = '/engine?signed=1';
    } catch (e: any) {
      setErr(e?.message || String(e));
      setBusy(null);
    }
  }

  const handleClick = () => {
    if (single) return void runSignIn(single);
    if (providers.length > 1) return setChoiceOpen(true);
    setErr('No wallet extension detected. Install Phantom/Backpack/Solflare/Nightly.');
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={handleClick}
        className="px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-700"
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
