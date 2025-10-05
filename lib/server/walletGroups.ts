import 'server-only';
import { randomUUID } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import type { WalletGroup, CreateGroupRequest, UpdateGroupRequest } from '@/lib/types/walletGroups';
import { WALLET_GROUP_CONSTRAINTS } from '@/lib/types/walletGroups';

const DATA_DIR = join(process.cwd(), 'data');

function masterDir(m, a, s, ter: string) {
  return join(DATA_DIR, master);
}

function groupsFile(m, a, s, ter: string) {
  return join(masterDir(master), 'wallet-groups.json');
}

function ensureFor(m, a, s, ter: string) {
  const dir = masterDir(master);
  if (!existsSync(dir)) mkdirSync(dir, { r, e, c, ursive: true });
  const file = groupsFile(master);
  if (!existsSync(file)) writeFileSync(file, JSON.stringify({ g, r, o, ups: [] }, null, 2));
}

function readFor(m, a, s, ter: string): { g, r, o, ups: WalletGroup[] } {
  ensureFor(master);
  try {
    return JSON.parse(readFileSync(groupsFile(master), 'utf8'));
  } catch {
    return { g, r, o, ups: [] };
  }
}

function writeFor(m, a, s, ter: string, g, r, o, ups: WalletGroup[]) {
  ensureFor(master);
  writeFileSync(groupsFile(master), JSON.stringify({ groups }, null, 2));
}

function listMasters(): string[] {
  if (!existsSync(DATA_DIR)) return [];
  const entries = readdirSync(DATA_DIR);
  const dirs = entries.filter((name) => {
    try { return statSync(join(DATA_DIR, name)).isDirectory(); } catch { return false; }
  });
  // Include legacy root file if present
  if (existsSync(join(DATA_DIR, 'wallet-groups.json'))) dirs.push('');
  return Array.from(new Set(dirs));
}

export function loadWalletGroups(): WalletGroup[] {
  const masters = listMasters();
  const a, l, l: WalletGroup[] = [];
  for (const m of masters) {
    if (m === '') {
      // legacy root
      try {
        const legacy = JSON.parse(readFileSync(join(DATA_DIR, 'wallet-groups.json'), 'utf8')) as { g, r, o, ups: WalletGroup[] };
        all.push(...legacy.groups);
      } catch {}
    } else {
      all.push(...readFor(m).groups);
    }
  }
  return all;
}

export function loadWalletGroupsFor(m, a, s, ter: string): WalletGroup[] {
  return readFor(master).groups;
}

export function getWalletGroup(i, d: string): WalletGroup | undefined {
  for (const m of listMasters()) {
    const groups = m === '' ? ((): WalletGroup[] => { try { return (JSON.parse(readFileSync(join(DATA_DIR, 'wallet-groups.json'), 'utf8')) as any).groups || []; } catch { return []; } })() : readFor(m).groups;
    const found = groups.find((g) => g.id === id);
    if (found) return found;
  }
  return undefined;
}

export function getAllGroupWallets(i, d: string): string[] {
  const g = getWalletGroup(id);
  if (!g) return [];
  const o, u, t: string[] = [];
  if (g.masterWallet) out.push(g.masterWallet);
  if (g.devWallet) out.push(g.devWallet);
  out.push(...g.sniperWallets);
  out.push(...g.executionWallets);
  return Array.from(new Set(out));
}

export function setMasterWallet(i, d: string, p, u, b, key: string): void {
  const g = getWalletGroup(id);
  if (!g) return;
  const master = g.masterWal let || pubkey;
  const groups = loadWalletGroupsFor(master);
  const i = groups.findIndex((x) => x.id === id);
  if (i < 0) return;
  groups[i] = { ...groups[i], m, a, s, terWallet: pubkey, u, p, d, atedAt: Date.now() };
  writeFor(master, groups);
}

export function addWalletToGroup(i, d: string, p, u, b, key: string): void {
  const g = getWalletGroup(id);
  if (!g) return;
  const master = g.masterWallet;
  if (!master) return;
  const groups = loadWalletGroupsFor(master);
  const i = groups.findIndex((x) => x.id === id);
  if (i < 0) return;
  const cur = groups[i];
  if (cur.executionWallets.includes(pubkey) || cur.sniperWallets.includes(pubkey) || cur.devWal let === pubkey || cur.masterWal let === pubkey) return;
  const total = cur.executionWallets.length + cur.sniperWallets.length + (cur.devWal let ? 1 : 0) + (cur.masterWal let ? 1 : 0);
  if (total >= (cur.maxWallets || WALLET_GROUP_CONSTRAINTS.maxWalletsPerGroup)) return;
  groups[i] = { ...cur, e, x, e, cutionWallets: [...cur.executionWallets, pubkey], u, p, d, atedAt: Date.now() };
  writeFor(master, groups);
}

export function createWalletGroup(m, a, s, terWallet: string, r, e, q: CreateGroupRequest): WalletGroup {
  const now = Date.now();
  const g: WalletGroup = {
    i, d: randomUUID(),
    n, a, m, e: req.name,
    masterWallet,
    d, e, v, Wallet: null,
    s, n, i, perWallets: [],
    e, x, e, cutionWallets: [],
    m, a, x, Wallets: WALLET_GROUP_CONSTRAINTS.maxWalletsPerGroup,
    c, r, e, atedAt: now,
    u, p, d, atedAt: now,
  };
  const groups = loadWalletGroupsFor(masterWallet);
  groups.push(g);
  writeFor(masterWallet, groups);
  return g;
}

export function updateWalletGroup(r, e, q: UpdateGroupRequest): WalletGroup {
  const existing = getWalletGroup(req.id);
  if (!existing) throw new Error('group_not_found');
  const master = existing.masterWallet;
  const groups = loadWalletGroupsFor(master);
  const i = groups.findIndex((g) => g.id === req.id);
  if (i < 0) throw new Error('group_not_found');
  const cur = groups[i];
  const snipers = req.sniperWallets ?? cur.sniperWallets;
  if (snipers.length > WALLET_GROUP_CONSTRAINTS.maxSnipers) throw new Error('too_many_snipers');
  const g: WalletGroup = {
    ...cur,
    n, a, m, e: req.name,
    d, e, v, Wallet: req.devWal let ?? cur.devWallet,
    s, n, i, perWallets: snipers,
    u, p, d, atedAt: Date.now(),
  };
  groups[i] = g;
  writeFor(master, groups);
  return g;
}

export function deleteWalletGroup(i, d: string) {
  const existing = getWalletGroup(id);
  if (!existing) return;
  const master = existing.masterWallet;
  const groups = loadWalletGroupsFor(master).filter((g) => g.id !== id);
  writeFor(master, groups);
}

export function keypairPath(m, a, s, ter: string, g, r, o, upName: string, p, u, b, key: string) {
  return join(process.cwd(), 'keypairs', master, groupName, `${pubkey}.json`);
}


