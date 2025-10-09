import { getSession } from '@/lib/server/session';
import { addTrackedWallet, getTrackedWallets, removeTrackedWallet } from '@/lib/server/wallets';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

async function addWallet(formData: FormData) {
  'use server';
  const w = String(formData.get('wallet') || '').trim();
  if (w) addTrackedWallet(w);
  revalidatePath('/wallets');
}

async function delWallet(formData: FormData) {
  'use server';
  const w = String(formData.get('wallet') || '').trim();
  if (w) removeTrackedWallet(w);
  revalidatePath('/wallets');
}

export default async function Page() {
  const session = getSession();
  const wallets = getTrackedWallets();
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="h1">Wallets</h1>
      {!session ? (
        <div className="card">
          <div className="label mb-2">Authentication Required</div>
          <p className="text-sm p-muted mb-3">
            Login with your wallet to manage tracked wallets used in PnL and Market tiles.
          </p>
          <a href="/login" className="button px-3 py-1 bg-zinc-800 hover:bg-zinc-700 inline-block">
            Login with wallet
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card">
            <div className="label mb-1">Session</div>
            <div className="text-sm">Logged in as: {session.userPubkey}</div>
          </div>
          <div className="bento">
            <section className="card">
              <div className="label mb-2">Add wallet</div>
              <form action={addWallet} className="flex gap-2">
                <input
                  type="text"
                  name="wallet"
                  placeholder="Base58 address"
                  className="input px-3 py-1 bg-zinc-900 w-full"
                  required
                  minLength={32}
                />
                <button type="submit" className="button px-3 py-1 bg-zinc-800 hover:bg-zinc-700">
                  Add
                </button>
              </form>
              <div className="text-xs p-muted mt-2">
                Use these wallets in PnL & Market tiles.
              </div>
            </section>
            <section className="card">
              <div className="label mb-2">Tracked wallets</div>
              {wallets.length === 0 ? (
                <div className="text-sm p-muted">No wallets yet</div>
              ) : (
                <ul className="text-sm space-y-2">
                  {wallets.map((w) => (
                    <li key={w} className="flex items-center justify-between gap-2">
                      <span className="font-mono break-all">{w}</span>
                      <form action={delWallet}>
                        <input type="hidden" name="wallet" value={w} />
                        <button className="button px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-xs" type="submit">
                          Remove
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}


