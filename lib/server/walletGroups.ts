import 'server-only';
import { randomUUID } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { WalletGroup, CreateGroupRequest, UpdateGroupRequest } from '@/lib/types/walletGroups';
import { WALLET_GROUP_CONSTRAINTS } from '@/lib/types/walletGroups';

const DATA_DIR = join(process.cwd(), 'data');
const GROUPS_FILE = join(DATA_DIR, 'wallet-groups.json');

function ensure() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(GROUPS_FILE)) writeFileSync(GROUPS_FILE, JSON.stringify({ groups: [] }, null, 2));
}

function loadAll(): { groups: WalletGroup[] } {
  ensure();
  try {
    return JSON.parse(readFileSync(GROUPS_FILE, 'utf8'));
  } catch {
    return { groups: [] };
  }
}

function saveAll(groups: WalletGroup[]) {
  ensure();
  writeFileSync(GROUPS_FILE, JSON.stringify({ groups }, null, 2));
}

export function loadWalletGroups(): WalletGroup[] {
  return loadAll().groups;
}

export function getWalletGroup(id: string): WalletGroup | undefined {
  return loadAll().groups.find((g) => g.id === id);
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
  const all = loadAll().groups;
  const i = all.findIndex((g) => g.id === id);
  if (i < 0) return;
  all[i] = { ...all[i], masterWallet: pubkey, updatedAt: Date.now() };
  saveAll(all);
}

export function addWalletToGroup(id: string, pubkey: string): void {
  const all = loadAll().groups;
  const i = all.findIndex((g) => g.id === id);
  if (i < 0) return;
  const g = all[i];
  if (g.executionWallets.includes(pubkey) || g.sniperWallets.includes(pubkey) || g.devWallet === pubkey || g.masterWallet === pubkey) return;
  if (g.executionWallets.length + g.sniperWallets.length + (g.devWallet?1:0) + (g.masterWallet?1:0) >= (g.maxWallets || WALLET_GROUP_CONSTRAINTS.maxWalletsPerGroup)) return;
  all[i] = { ...g, executionWallets: [...g.executionWallets, pubkey], updatedAt: Date.now() };
  saveAll(all);
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
  const all = loadAll().groups;
  all.push(g);
  saveAll(all);
  return g;
}

export function updateWalletGroup(req: UpdateGroupRequest): WalletGroup {
  const all = loadAll().groups;
  const i = all.findIndex((g) => g.id === req.id);
  if (i < 0) throw new Error('group_not_found');
  const cur = all[i];
  const snipers = req.sniperWallets ?? cur.sniperWallets;
  if (snipers.length > WALLET_GROUP_CONSTRAINTS.maxSnipers) throw new Error('too_many_snipers');
  const g: WalletGroup = {
    ...cur,
    name: req.name,
    devWallet: req.devWallet ?? cur.devWallet,
    sniperWallets: snipers,
    updatedAt: Date.now(),
  };
  all[i] = g;
  saveAll(all);
  return g;
}

export function deleteWalletGroup(id: string) {
  const all = loadAll().groups.filter((g) => g.id !== id);
  saveAll(all);
}

export function keypairPath(master: string, groupName: string, pubkey: string) {
  return join(process.cwd(), 'keypairs', master, groupName, `${pubkey}.json`);
}

