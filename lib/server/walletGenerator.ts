import 'server-only';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Keypair } from '@solana/web3.js';
import { getWalletGroup, addWalletToGroup, keypairPath } from './walletGroups';
import { createDailyJournal, logJsonLine } from '@/lib/core/src/journal';
import { saveKeypair as saveEncryptedKeypair } from './keystore';

export type GeneratedWalletsResult = {
  groupId: string;
  groupName: string;
  generated: string[]; // pubkeys
  skipped: number; // due to capacity
  available: number; // remaining capacity after
};

export function generateWalletsForGroup(groupId: string, count: number): GeneratedWalletsResult {
  const safeCount = Math.max(1, Math.min(100, Number(count) || 1));
  const group = getWalletGroup(groupId);
  if (!group) throw new Error('Group not found');

  const dir = join(process.cwd(), 'keypairs', group.masterWallet || 'unassigned', group.name);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const currentTotal =
    (group.masterWallet ? 1 : 0) +
    (group.devWallet ? 1 : 0) +
    group.sniperWallets.length +
    group.executionWallets.length;
  const capacity = Math.max(0, group.maxWallets - currentTotal);
  const alloc = Math.min(safeCount, capacity);

  const generated: string[] = [];
  const journal = createDailyJournal('data');
  for (let i = 0; i < alloc; i++) {
    const kp = Keypair.generate();
    const pub = kp.publicKey.toBase58();
    // Save encrypted keystore entry
    saveEncryptedKeypair(group.masterWallet || 'unassigned', group.name, kp);
    // Register to group execution wallets
    addWalletToGroup(groupId, pub);
    generated.push(pub);
    logJsonLine(journal, { ev: 'wallet_generated', group: group.name, pub });
  }

  return {
    groupId,
    groupName: group.name,
    generated,
    skipped: safeCount - alloc,
    available: Math.max(0, group.maxWallets - (currentTotal + alloc)),
  };
}
