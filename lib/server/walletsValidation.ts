import 'server-only';
import { PublicKey } from '@solana/web3.js';

export function isValidWalletAddress(value: string): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  try {
    const pk = new PublicKey(trimmed);
    return pk.toBase58() === trimmed;
  } catch {
    return false;
  }
}
