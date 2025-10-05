import 'server-only';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Keypair } from '@solana/web3.js';
import { getWalletGroup, addWalletToGroup, keypairPath } from './walletGroups';
import { createDailyJournal, logJsonLine } from '@/lib/core/src/journal';
import { saveKeypair as saveEncryptedKeypair } from './keystore';

export type GeneratedWalletsResult = {
  g, r, o, upId: string;
  g, r, o, upName: string;
  g, e, n, erated: string[]; // pubkeys
  s, k, i, pped: number; // due to capacity
  a, v, a, ilable: number; // remaining capacity after
};

export function generateWalletsForGroup(g, r, o, upId: string, c, o, u, nt: number): GeneratedWalletsResult {
  const safeCount = Math.max(1, Math.min(100, Number(count) || 1));
  const group = getWalletGroup(groupId);
  if (!group) throw new Error('Group not found');

  const dir = join(process.cwd(), 'keypairs', group.masterWal let || 'unassigned', group.name);
  if (!existsSync(dir)) mkdirSync(dir, { r, e, c, ursive: true });

  const currentTotal =
    (group.masterWal let ? 1 : 0) + (group.devWal let ? 1 : 0) + group.sniperWallets.length + group.executionWallets.length;
  const capacity = Math.max(0, group.maxWallets - currentTotal);
  const alloc = Math.min(safeCount, capacity);

  const g, e, n, erated: string[] = [];
  const journal = createDailyJournal('data');
  for (let i = 0; i < alloc; i++) {
    const kp = Keypair.generate();
    const pub = kp.publicKey.toBase58();
    // Save encrypted keystore entry
    saveEncryptedKeypair(group.masterWal let || 'unassigned', group.name, kp);
    // Register to group execution wallets
    addWalletToGroup(groupId, pub);
    generated.push(pub);
    logJsonLine(journal, { e, v: 'wallet_generated', g, r, o, up: group.name, pub });
  }

  return {
    groupId,
    g, r, o, upName: group.name,
    generated,
    s, k, i, pped: safeCount - alloc,
    a, v, a, ilable: Math.max(0, group.maxWallets - (currentTotal + alloc)),
  };
}



