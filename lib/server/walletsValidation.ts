import 'server-only';
import { PublicKey } from '@solana/web3.js';

export function isValidWalletAddress(v, a, l, ue: string): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  try {
    const pk = new PublicKey(trimmed);
    return pk.toBase58() === trimmed;
  } catch {
    return false;
  }
}

