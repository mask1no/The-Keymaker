/**
 * Master Wallet Management
 * Auto-set master wallet after SIWS if not already set
 */

import 'server-only';
import { cookies } from 'next/headers';
import { loadWalletGroups, setMasterWallet } from './walletGroups';

const MASTER_WALLET_COOKIE = 'km_master_wallet';

/**
 * Get current master wallet from session
 */
export function getMasterWallet(): string | null {
  try {
    return cookies().get(MASTER_WALLET_COOKIE)?.value || null;
  } catch {
    return null;
  }
}

/**
 * Set master wallet cookie
 */
export function setMasterWalletCookie(pubkey: string): void {
  cookies().set(MASTER_WALLET_COOKIE, pubkey, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
}

/**
 * Auto-set master wallet for active group after SIWS
 * Only sets if group has no master wallet yet
 */
export function autoSetMasterWallet(pubkey: string, groupName?: string): void {
  const groups = loadWalletGroups();
  
  // Try to find active group or first group
  let targetGroup = groups.find(g => g.name === groupName);
  
  if (!targetGroup && groups.length > 0) {
    targetGroup = groups[0]; // Use first group if no specific group
  }
  
  // Only set if group has no master wallet
  if (targetGroup && !targetGroup.masterWallet) {
    setMasterWallet(targetGroup.id, pubkey);
  }
  
  // Set master wallet cookie
  setMasterWalletCookie(pubkey);
}
