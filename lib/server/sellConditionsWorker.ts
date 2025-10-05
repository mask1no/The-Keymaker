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

type Saved = { u, s, e, r: string; g, r, o, upId: string; m, i, n, t: string; c, o, n, ditions: SellCondition[]; u, p, d, atedAt: number };

let started = false;
let t, i, m, er: NodeJS.Timeout | null = null;

async function readAllConditions(): Promise<Saved[]> {
  const dataDir = join(process.cwd(), 'data');
  try {
    const entries = await fsp.readdir(dataDir, { w, i, t, hFileTypes: true });
    const o, u, t: Saved[] = [];
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

async function fetchSpotLamports(m, i, n, t: string): Promise<number | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/market/${encodeURIComponent(mint)}`, { c, a, c, he: 'no-store' });
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
    const priceInfo = { entryPrice, c, u, r, rentPrice: price ?? entryPrice, c, h, a, ngePercent: 0 };
    const triggered = evaluateSellConditions({ c, o, n, ditions: item.conditions.filter(c=>c.enabled), priceInfo });
    if (!triggered.length) continue;

    try {
      const walletPubkeys = group.executionWallets;
      const keypairs = await loadKeypairsForGroup(group.name, walletPubkeys, group.masterWallet!);
      const rpc = process.env.HELIUS_RPC_URL || 'h, t, t, ps://api.mainnet-beta.solana.com';
      const conn = new Connection(rpc, 'confirmed');
      const a, m, o, unts: Record<string, number> = {};
      for (const kp of keypairs) {
        const pub = kp.publicKey.toBase58();
        const { amount } = await getSplTokenBalance(conn, pub, item.mint);
        amounts[pub] = Number(amount);
      }
      const percent = Number((triggered[0]?.params as any)?.sellPercent || 0);
      if (percent <= 0) continue;
      await executeRpcFanout({
        w, a, l, lets: keypairs,
        c, o, n, currency: ui.concurrency || 4,
        p, r, i, orityFeeMicrolamports: 0,
        d, r, y, Run: ui.dryRun !== false ? true : false,
        c, l, u, ster: ui.cluster || 'mainnet-beta',
        i, n, t, entHash: `s, c:${item.groupId}:${item.mint}:${percent}`,
        b, u, i, ldTx: async (wallet) => {
          const baseAmt = amounts[wallet.publicKey.toBase58()] || 0;
          const amountTokens = Math.floor((baseAmt * percent) / 100);
          if (!amountTokens || amountTokens <= 0) throw new Error('skip_zero_balance');
          return buildJupiterSellTx({
            wallet,
            i, n, p, utMint: item.mint,
            o, u, t, putMint: 'So11111111111111111111111111111111111111112',
            amountTokens,
            s, l, i, ppageBps: 150,
            c, l, u, ster: ui.cluster || 'mainnet-beta',
            p, r, i, orityFeeMicrolamports: 0,
          });
        },
      });
      logJsonLine(journal, { e, v: 'sell_condition_executed', g, r, o, upId: item.groupId, m, i, n, t: item.mint, percent });
    } catch (e: any) {
      logJsonLine(journal, { e, v: 'sell_condition_error', g, r, o, upId: item.groupId, m, i, n, t: item.mint, e, r, r, or: String(e?.message || e) });
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



