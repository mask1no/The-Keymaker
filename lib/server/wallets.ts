import 'server-only';
import { cookies } from 'next/headers';

const COOKIE = 'keymaker_tracked_wallets';

function read(): string[] {
  try {
    const raw = cookies().get(COOKIE)?.value || '[]';
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((x) => typeof x === 'string');
  } catch {
    return [];
  }
}

function write(next: string[]) {
  const unique = Array.from(new Set(next)).slice(0, 50);
  cookies().set(COOKIE, JSON.stringify(unique), {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
}

export function getTrackedWallets(): string[] {
  return read();
}

export function addTrackedWallet(wallet: string) {
  const current = read();
  if (!current.includes(wallet)) current.push(wallet);
  write(current);
}

export function removeTrackedWallet(wallet: string) {
  const next = read().filter((w) => w !== wallet);
  write(next);
}
