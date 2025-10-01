/**
 * Wallet Groups Server-Side Management
 * CRUD operations for wallet groups with master wallet support
 */

import 'server-only';
import { randomUUID } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { WalletGroup, CreateGroupRequest, UpdateGroupRequest, FundingPlan, FundingDistribution } from '@/lib/types/walletGroups';
import { WALLET_GROUP_CONSTRAINTS } from '@/lib/types/walletGroups';

const GROUPS_FILE = join(process.cwd(), 'data', 'wallet-groups.json');

// Ensure data directory exists
const dataDir = join(process.cwd(), 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

/**
 * Load all wallet groups
 */
export function loadWalletGroups(): WalletGroup[] {
  try {
    if (!existsSync(GROUPS_FILE)) {
      return [];
    }
    const content = readFileSync(GROUPS_FILE, 'utf8');
    return JSON.parse(content) as WalletGroup[];
  } catch (error) {
    console.error('Failed to load wallet groups:', error);
    return [];
  }
}

/**
 * Namespaced keypair path helper: keypairs/<master>/<group>/<pubkey>.json
 */
export function keypairPath(masterPubkey: string, groupName: string, pubkey: string): string {
  return join(process.cwd(), 'keypairs', masterPubkey, groupName, `${pubkey}.json`);
}

/**
 * Save wallet groups
 */
function saveWalletGroups(groups: WalletGroup[]): void {
  try {
    writeFileSync(GROUPS_FILE, JSON.stringify(groups, null, 2), 'utf8');
  } catch (error) {
    throw new Error(`Failed to save wallet groups: ${(error as Error).message}`);
  }
}

/**
 * Create a new wallet group
 */
export function createWalletGroup(request: CreateGroupRequest, executionWallets: string[]): WalletGroup {
  const groups = loadWalletGroups();
  
  // Validate
  if (!request.name || request.name.length < WALLET_GROUP_CONSTRAINTS.MIN_GROUP_NAME_LENGTH) {
    throw new Error('Group name is required');
  }
  
  if (request.name.length > WALLET_GROUP_CONSTRAINTS.MAX_GROUP_NAME_LENGTH) {
    throw new Error(`Group name must be less than ${WALLET_GROUP_CONSTRAINTS.MAX_GROUP_NAME_LENGTH} characters`);
  }
  
  if (executionWallets.length > WALLET_GROUP_CONSTRAINTS.MAX_WALLETS_PER_GROUP) {
    throw new Error(`Cannot create group with more than ${WALLET_GROUP_CONSTRAINTS.MAX_WALLETS_PER_GROUP} wallets`);
  }
  
  // Check for duplicate name
  if (groups.some(g => g.name === request.name)) {
    throw new Error(`Group with name "${request.name}" already exists`);
  }
  
  const now = new Date().toISOString();
  const group: WalletGroup = {
    id: randomUUID(),
    name: request.name,
    createdAt: now,
    updatedAt: now,
    masterWallet: request.masterWallet,
    sniperWallets: [],
    executionWallets,
    maxWallets: WALLET_GROUP_CONSTRAINTS.MAX_WALLETS_PER_GROUP,
  };
  
  groups.push(group);
  saveWalletGroups(groups);
  
  return group;
}

/**
 * Get wallet group by ID
 */
export function getWalletGroup(id: string): WalletGroup | null {
  const groups = loadWalletGroups();
  return groups.find(g => g.id === id) || null;
}

/**
 * Get wallet group by name
 */
export function getWalletGroupByName(name: string): WalletGroup | null {
  const groups = loadWalletGroups();
  return groups.find(g => g.name === name) || null;
}

/**
 * Update wallet group
 */
export function updateWalletGroup(request: UpdateGroupRequest): WalletGroup {
  const groups = loadWalletGroups();
  const index = groups.findIndex(g => g.id === request.id);
  
  if (index === -1) {
    throw new Error('Group not found');
  }
  
  const group = groups[index];
  
  // Update fields
  if (request.name !== undefined) {
    // Check for duplicate name
    if (groups.some((g, i) => i !== index && g.name === request.name)) {
      throw new Error(`Group with name "${request.name}" already exists`);
    }
    group.name = request.name;
  }
  
  if (request.masterWallet !== undefined) {
    group.masterWallet = request.masterWallet;
  }
  
  if (request.devWallet !== undefined) {
    group.devWallet = request.devWallet;
  }
  
  if (request.sniperWallets !== undefined) {
    if (request.sniperWallets.length > WALLET_GROUP_CONSTRAINTS.MAX_SNIPER_WALLETS) {
      throw new Error(`Cannot have more than ${WALLET_GROUP_CONSTRAINTS.MAX_SNIPER_WALLETS} sniper wallets`);
    }
    group.sniperWallets = request.sniperWallets;
  }
  
  group.updatedAt = new Date().toISOString();
  
  groups[index] = group;
  saveWalletGroups(groups);
  
  return group;
}

/**
 * Delete wallet group
 */
export function deleteWalletGroup(id: string): boolean {
  const groups = loadWalletGroups();
  const filtered = groups.filter(g => g.id !== id);
  
  if (filtered.length === groups.length) {
    return false; // Group not found
  }
  
  saveWalletGroups(filtered);
  return true;
}

/**
 * Add wallet to group's execution wallets
 */
export function addWalletToGroup(groupId: string, wallet: string): WalletGroup {
  const groups = loadWalletGroups();
  const group = groups.find(g => g.id === groupId);
  
  if (!group) {
    throw new Error('Group not found');
  }
  
  const totalWallets = 
    1 + // master (if set)
    (group.devWallet ? 1 : 0) +
    group.sniperWallets.length +
    group.executionWallets.length;
  
  if (totalWallets >= group.maxWallets) {
    throw new Error(`Group is at maximum capacity (${group.maxWallets} wallets)`);
  }
  
  if (group.executionWallets.includes(wallet)) {
    throw new Error('Wallet already exists in group');
  }
  
  group.executionWallets.push(wallet);
  group.updatedAt = new Date().toISOString();
  
  saveWalletGroups(groups);
  return group;
}

/**
 * Remove wallet from group
 */
export function removeWalletFromGroup(groupId: string, wallet: string): WalletGroup {
  const groups = loadWalletGroups();
  const group = groups.find(g => g.id === groupId);
  
  if (!group) {
    throw new Error('Group not found');
  }
  
  group.executionWallets = group.executionWallets.filter(w => w !== wallet);
  group.sniperWallets = group.sniperWallets.filter(w => w !== wallet);
  
  if (group.devWallet === wallet) {
    group.devWallet = undefined;
  }
  
  group.updatedAt = new Date().toISOString();
  
  saveWalletGroups(groups);
  return group;
}

/**
 * Generate random funding distribution plan
 */
export function generateFundingPlan(
  groupId: string, 
  totalSOL: number, 
  strategy: 'equal' | 'weighted' | 'random' = 'equal'
): FundingPlan {
  const group = getWalletGroup(groupId);
  
  if (!group) {
    throw new Error('Group not found');
  }
  
  const distribution: FundingDistribution[] = [];
  
  // Collect all wallets
  const allWallets: Array<{ wallet: string; purpose: FundingDistribution['purpose'] }> = [];
  
  if (group.masterWallet) {
    allWallets.push({ wallet: group.masterWallet, purpose: 'master' });
  }
  
  if (group.devWallet) {
    allWallets.push({ wallet: group.devWallet, purpose: 'dev' });
  }
  
  group.sniperWallets.forEach(w => {
    allWallets.push({ wallet: w, purpose: 'sniper' });
  });
  
  group.executionWallets.forEach(w => {
    allWallets.push({ wallet: w, purpose: 'execution' });
  });
  
  if (allWallets.length === 0) {
    throw new Error('No wallets in group');
  }
  
  // Calculate distribution based on strategy
  if (strategy === 'equal') {
    const amountPerWallet = totalSOL / allWallets.length;
    allWallets.forEach(({ wallet, purpose }) => {
      distribution.push({ wallet, amount: amountPerWallet, purpose });
    });
  } else if (strategy === 'weighted') {
    // Master gets 2x, snipers get 1.5x, rest get 1x
    const weights = allWallets.map(w => {
      if (w.purpose === 'master') return 2;
      if (w.purpose === 'sniper') return 1.5;
      return 1;
    });
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    
    allWallets.forEach(({ wallet, purpose }, idx) => {
      const amount = (weights[idx] / totalWeight) * totalSOL;
      distribution.push({ wallet, amount, purpose });
    });
  } else if (strategy === 'random') {
    // Generate random weights
    const weights = allWallets.map(() => 0.5 + Math.random());
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    
    allWallets.forEach(({ wallet, purpose }, idx) => {
      const amount = (weights[idx] / totalWeight) * totalSOL;
      distribution.push({ wallet, amount, purpose });
    });
  }
  
  return {
    groupId: group.id,
    totalSOL,
    distribution,
    strategy,
  };
}

/**
 * Set master wallet for group (auto-set after SIWS)
 */
export function setMasterWallet(groupId: string, masterWallet: string): WalletGroup {
  return updateWalletGroup({
    id: groupId,
    masterWallet,
  });
}

/**
 * Get all wallets from a group (flattened)
 */
export function getAllGroupWallets(groupId: string): string[] {
  const group = getWalletGroup(groupId);
  if (!group) return [];
  
  const wallets: string[] = [];
  
  if (group.masterWallet) wallets.push(group.masterWallet);
  if (group.devWallet) wallets.push(group.devWallet);
  wallets.push(...group.sniperWallets);
  wallets.push(...group.executionWallets);
  
  return wallets;
}
