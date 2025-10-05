import 'server-only';
import { randomUUID } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import type { WalletGroup, CreateGroupRequest, UpdateGroupRequest } from '@/lib/types/walletGroups';
import { WALLET_GROUP_CONSTRAINTS } from '@/lib/types/walletGroups';

const DATA_DIR = join(process.cwd(), 'data');

function masterDir(master: string) {
  return join(DATA_DIR, master);
}

function groupsFile(master: string) {
  return join(masterDir(master), 'wallet-groups.json');
}

function ensureFor(master: string) {
  const dir = masterDir(master);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const file = groupsFile(master);
  if (!existsSync(file)) writeFileSync(file, JSON.stringify({ groups: [] }, null, 2));
}

function readFor(master: string): { groups: WalletGroup[] } {
  ensureFor(master);
  try {
    return JSON.parse(readFileSync(groupsFile(master), 'utf8'));
  } catch {
    return { groups: [] };
  }
}

function writeFor(master: string, groups: WalletGroup[]) {
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
  const all: WalletGroup[] = [];
  for (const m of masters) {
    if (m === '') {
      // legacy root
      try {
        const legacy = JSON.parse(readFileSync(join(DATA_DIR, 'wallet-groups.json'), 'utf8')) as { groups: WalletGroup[] };
        all.push(...legacy.groups);
      } catch {}
    } else {
      all.push(...readFor(m).groups);
    }
  }
  return all;
}

export function loadWalletGroupsFor(master: string): WalletGroup[] {
  return readFor(master).groups;
}

export function getWalletGroup(id: string): WalletGroup | undefined {
  for (const m of listMasters()) {
    const groups = m === '' ? ((): WalletGroup[] => { try { return (JSON.parse(readFileSync(join(DATA_DIR, 'wallet-groups.json'), 'utf8')) as any).groups || []; } catch { return []; } })() : readFor(m).groups;
    const found = groups.find((g) => g.id === id);
    if (found) return found;
  }
  return undefined;
}

export function getAllGroupWallets(id: string): string[] {
  const g = getWalletGroup(id);
  if (!g) return [];
  const out: string[] = [];
  if (g.masterWallet) out.push(g.masterWallet);
  if (g.devWallet) out.push(g.devWallet);
  out.push(...g.sniperWallets);
  out.push(...g.executionWallets);
  return Array.from(new Set(out));
}

export function setMasterWallet(id: string, pubkey: string): void {
  const g = getWalletGroup(id);
  if (!g) return;
  const master = g.masterWallet || pubkey;
  const groups = loadWalletGroupsFor(master);
  const i = groups.findIndex((x) => x.id === id);
  if (i < 0) return;
  groups[i] = { ...groups[i], masterWallet: pubkey, updatedAt: Date.now() };
  writeFor(master, groups);
}

export function addWalletToGroup(id: string, pubkey: string): void {
  const g = getWalletGroup(id);
  if (!g) return;
  const master = g.masterWallet;
  if (!master) return;
  const groups = loadWalletGroupsFor(master);
  const i = groups.findIndex((x) => x.id === id);
  if (i < 0) return;
  const cur = groups[i];
  if (cur.executionWallets.includes(pubkey) || cur.sniperWallets.includes(pubkey) || cur.devWallet === pubkey || cur.masterWallet === pubkey) return;
  const total = cur.executionWallets.length + cur.sniperWallets.length + (cur.devWallet ? 1 : 0) + (cur.masterWallet ? 1 : 0);
  if (total >= (cur.maxWallets || WALLET_GROUP_CONSTRAINTS.maxWalletsPerGroup)) return;
  groups[i] = { ...cur, executionWallets: [...cur.executionWallets, pubkey], updatedAt: Date.now() };
  writeFor(master, groups);
}

export function createWalletGroup(masterWallet: string, req: CreateGroupRequest): WalletGroup {
  const now = Date.now();
  const g: WalletGroup = {
    id: randomUUID(),
    name: req.name,
    masterWallet,
    devWallet: null,
    sniperWallets: [],
    executionWallets: [],
    maxWallets: WALLET_GROUP_CONSTRAINTS.maxWalletsPerGroup,
    createdAt: now,
    updatedAt: now,
  };
  const groups = loadWalletGroupsFor(masterWallet);
  groups.push(g);
  writeFor(masterWallet, groups);
  return g;
}

export function updateWalletGroup(req: UpdateGroupRequest): WalletGroup {
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
    name: req.name,
    devWallet: req.devWallet ?? cur.devWallet,
    sniperWallets: snipers,
    updatedAt: Date.now(),
  };
  groups[i] = g;
  writeFor(master, groups);
  return g;
}

export function deleteWalletGroup(id: string) {
  const existing = getWalletGroup(id);
  if (!existing) return;
  const master = existing.masterWallet;
  const groups = loadWalletGroupsFor(master).filter((g) => g.id !== id);
  writeFor(master, groups);
}

export function keypairPath(master: string, groupName: string, pubkey: string) {
  return join(process.cwd(), 'keypairs', master, groupName, `${pubkey}.json`);
}


