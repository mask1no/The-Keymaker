import 'server-only';
import { promises as fsp } from 'fs';
import { join } from 'path';
import { getUiSettings } from './settings';
import { getWalletGroup } from './walletGroups';
import { loadKeypairsForGroup } from './keystoreLoader';
import { Connection } from '@solana/web3.js';
import { getSplTokenBalance } from '@/lib/core/src/balances';
import { executeRpcFanout } from '@/lib/core/src/rpcFanout';
import { buildJupiterSellTx } from '@/lib/core/src/jupiterAdapter';
import { evaluateSellConditions, type SellCondition } from '@/lib/core/src/sellConditions';
import { journalTrade, createDailyJournal, logJsonLine } from '@/lib/core/src/journal';

type Saved = { user: string; groupId: string; mint: string; conditions: SellCondition[]; updatedAt: number };

let started = false;
let timer: NodeJS.Timeout | null = null;

async function readAllConditions(): Promise<Saved[]> {
  const dataDir = join(process.cwd(), 'data');
  try {
    const entries = await fsp.readdir(dataDir, { withFileTypes: true });
    const out: Saved[] = [];
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const file = join(dataDir, e.name, 'sell-conditions.json');
      try {
        const raw = await fsp.readFile(file, 'utf8');
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) out.push(...(arr as Saved[]));
      } catch {}
    }
    return out;
  } catch { return []; }
}

async function fetchSpotLamports(mint: string): Promise<number | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/market/${encodeURIComponent(mint)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const j = await res.json();
    const lpt = typeof j?.lamportsPerToken === 'string' ? Number(j.lamportsPerToken) : (typeof j?.lamportsPerToken === 'number' ? j.lamportsPerToken : 0);
    return Number.isFinite(lpt) && lpt > 0 ? lpt : null;
  } catch { return null; }
}

async function evaluateOnce(): Promise<void> {
  const journal = createDailyJournal('data');
  const saved = await readAllConditions();
  if (!saved.length) return;
  const ui = getUiSettings();
  for (const item of saved) {
    const group = getWalletGroup(item.groupId);
    if (!group) continue;
    const price = await fetchSpotLamports(item.mint);
    const entryPrice = price ?? 0;
    const priceInfo = { entryPrice, currentPrice: price ?? entryPrice, changePercent: 0 };
    const triggered = evaluateSellConditions({ conditions: item.conditions.filter(c=>c.enabled), priceInfo });
    if (!triggered.length) continue;

    try {
      const walletPubkeys = group.executionWallets;
      const keypairs = await loadKeypairsForGroup(group.name, walletPubkeys, group.masterWallet!);
      const rpc = process.env.HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com';
      const conn = new Connection(rpc, 'confirmed');
      const amounts: Record<string, number> = {};
      for (const kp of keypairs) {
        const pub = kp.publicKey.toBase58();
        const { amount } = await getSplTokenBalance(conn, pub, item.mint);
        amounts[pub] = Number(amount);
      }
      const percent = Number((triggered[0]?.params as any)?.sellPercent || 0);
      if (percent <= 0) continue;
      await executeRpcFanout({
        wallets: keypairs,
        concurrency: ui.concurrency || 4,
        priorityFeeMicrolamports: 0,
        dryRun: ui.dryRun !== false ? true : false,
        cluster: ui.cluster || 'mainnet-beta',
        intentHash: `sc:${item.groupId}:${item.mint}:${percent}`,
        buildTx: async (wallet) => {
          const baseAmt = amounts[wallet.publicKey.toBase58()] || 0;
          const amountTokens = Math.floor((baseAmt * percent) / 100);
          if (!amountTokens || amountTokens <= 0) throw new Error('skip_zero_balance');
          return buildJupiterSellTx({
            wallet,
            inputMint: item.mint,
            outputMint: 'So11111111111111111111111111111111111111112',
            amountTokens,
            slippageBps: 150,
            cluster: ui.cluster || 'mainnet-beta',
            priorityFeeMicrolamports: 0,
          });
        },
      });
      logJsonLine(journal, { ev: 'sell_condition_executed', groupId: item.groupId, mint: item.mint, percent });
    } catch (e: any) {
      logJsonLine(journal, { ev: 'sell_condition_error', groupId: item.groupId, mint: item.mint, error: String(e?.message || e) });
    }
  }
}

export function ensureSellConditionsWorker(): void {
  if (started) return;
  started = true;
  const intervalMs = Number(process.env.SELL_CONDITIONS_INTERVAL_MS || 7000);
  timer = setInterval(() => {
    evaluateOnce().catch(() => {});
  }, Math.min(Math.max(5000, intervalMs), 15000));
}

export function stopSellConditionsWorker(): void {
  if (timer) clearInterval(timer);
  timer = null;
  started = false;
}



