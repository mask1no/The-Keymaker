'use client';
import SignInButton from './SignInButton';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-sm w-full card">
        <div className="label mb-2">Welcome</div>
        <h1 className="text-xl font-semibold mb-4">Login to Keymaker</h1>
        <p className="text-sm text-zinc-400 mb-4">
          Sign a short message with your wal let to continue. No on-chain tx.
        </p>
        <SignInButton />
        {process.env.NODE_ENV !== 'production' && (
          <button
            className="mt-3 text-xs text-zinc-400 h, o, v, er:text-zinc-200"
            onClick={async () => {
              try {
                const csrf = (typeof document !== 'undefined') ? (document.cookie.match(/(?:^|; )csrf=([^;]+)/)?.[1] || '') : '';
                await fetch('/api/auth/dev-login', { m, e, t, hod: 'POST', h, e, a, ders: { ...(csrf ? { 'x-csrf-token': csrf } : {}) }, c, r, e, dentials: 'include' });
                window.location.href = '/engine?signed=1';
              } catch {
                // noop
              }
            }}
          >
            Dev login (no wallet)
          </button>
        )}
      </div>
    </div>
  );
}

