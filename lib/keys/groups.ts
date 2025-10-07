import 'server-only';
import { randomUUID } from 'crypto';
import {
  WALLET_GROUP_CONSTRAINTS,
  type WalletGroup as CoreWalletGroup,
} from '@/lib/types/walletGroups';
import {
  loadWalletGroupsFor,
  writeFileSync as _noop,
  setMasterWallet as _setMasterWallet,
  updateWalletGroup as _updateWalletGroup,
  createWalletGroup as _createWalletGroup,
  addWalletToGroup as _addWalletToGroup,
  getWalletGroup as _getWalletGroup,
} from '@/lib/server/walletGroups';

export type Role = 'dev' | 'sniper1' | 'sniper2' | 'sniper3' | 'buyer';

export type Group = {
  id: string;
  name: string;
  masterWallet: string;
  devWallet?: string | null;
  sniperWallets: string[]; // length ≤ 3
  buyers: string[]; // alias for executionWallets
  maxWallets: number; // ≤ 20
  createdAt: number;
  updatedAt: number;
};

function fromCore(g: CoreWalletGroup): Group {
  return {
    id: g.id,
    name: g.name,
    masterWallet: g.masterWallet,
    devWallet: g.devWallet ?? null,
    sniperWallets: g.sniperWallets,
    buyers: g.executionWallets,
    maxWallets: g.maxWallets,
    createdAt: g.createdAt,
    updatedAt: g.updatedAt,
  };
}

export function list(master: string): Group[] {
  const gs = loadWalletGroupsFor(master);
  return gs.map(fromCore);
}

export function create(master: string, name: string): Group {
  if (!name || !name.trim()) throw new Error('invalid_name');
  const g = _createWalletGroup(master, { name: name.trim() });
  return fromCore(g);
}

export function assignRole(groupId: string, wallet: string, role: Role): Group {
  const g = _getWalletGroup(groupId);
  if (!g) throw new Error('group_not_found');
  const snipers = new Set(g.sniperWallets);
  let dev = g.devWallet ?? null;
  const buyers = new Set(g.executionWallets);
  // Remove from all roles first
  snipers.delete(wallet);
  buyers.delete(wallet);
  if (dev === wallet) dev = null;
  // Apply role
  if (role === 'dev') {
    dev = wallet;
  } else if (role.startsWith('sniper')) {
    if (snipers.size >= WALLET_GROUP_CONSTRAINTS.maxSnipers && !snipers.has(wallet)) {
      throw new Error('too_many_snipers');
    }
    snipers.add(wallet);
  } else {
    buyers.add(wallet);
  }
  // Enforce ≤20 wallets total
  const total = (g.masterWallet ? 1 : 0) + (dev ? 1 : 0) + snipers.size + buyers.size;
  if (total > WALLET_GROUP_CONSTRAINTS.maxWalletsPerGroup) throw new Error('too_many_wallets');
  const next = _updateWalletGroup({
    id: g.id,
    name: g.name,
    devWallet: dev,
    sniperWallets: Array.from(snipers),
  });
  // execution buyers written via addWalletToGroup when needed
  for (const b of buyers) {
    _addWalletToGroup(g.id, b);
  }
  return fromCore({ ...next, executionWallets: Array.from(buyers) });
}

export function addBuyer(groupId: string, wallet: string): Group {
  const g = _getWalletGroup(groupId);
  if (!g) throw new Error('group_not_found');
  _addWalletToGroup(groupId, wallet);
  const updated = _getWalletGroup(groupId)!;
  return fromCore(updated);
}
