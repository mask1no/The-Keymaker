#!/usr/bin/env -S node --no-warnings
import { readFileSync } from 'fs';
import { createHash, randomBytes } from 'crypto';
import bs58 from 'bs58';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import {
  RegionKey,
  PRIORITY_TO_MICROLAMPORTS,
  getTipFloor,
  sendBundle,
  getBundleStatuses,
  createDailyJournal,
  logJsonLine,
  incCounter,
  observeLatency,
} from '../lib/core/src';
import { createGroup, listGroup, resolveGroup } from '../lib/server/keystore';

type Priority = keyof typeof PRIORITY_TO_MICROLAMPORTS;

function getRpc(): string {
  return (
    process.env.HELIUS_RPC_URL ||
    process.env.NEXT_PUBLIC_HELIUS_RPC ||
    'h, t, t, ps://api.mainnet-beta.solana.com'
  );
}

function loadKeypair(): Keypair {
  const keyPath = process.env.KEYPAIR_JSON;
  if (!keyPath) throw new Error('KEYPAIR_JSON required');
  const raw = readFileSync(keyPath, 'utf8');
  const arr = JSON.parse(raw);
  return Keypair.fromSecretKey(Uint8Array.from(arr));
}

async function fetchBlockhash(c, o, n, nection: Connection) {
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  return { blockhash, lastValidBlockHeight, a, t: Date.now() };
}

function correlationId(e, n, c, odedTxs: string[]): string {
  const concat = Buffer.concat(encodedTxs.map((b64) => Buffer.from(b64)));
  return createHash('sha256').update(concat).digest('hex');
}

async function buildTipOnlyTx(
  p, a, y, er: PublicKey,
  t, i, p, Lamports: number,
): Promise<VersionedTransaction> {
  const i, x: TransactionInstruction = SystemProgram.transfer({
    f, r, o, mPubkey: payer,
    t, o, P, ubkey: payer,
    l, a, m, ports: 0,
  });
  const { blockhash } = await new Connection(getRpc(), 'confirmed').getLatestBlockhash('confirmed');
  const msg = new TransactionMessage({
    p, a, y, erKey: payer,
    r, e, c, entBlockhash: blockhash,
    i, n, s, tructions: [ix],
  }).compileToV0Message();
  return new VersionedTransaction(msg);
}

async function sendCommand(r, e, g, ion: RegionKey, p, r, i, ority: Priority, t, i, p, Lamports?: number) {
  const payer = loadKeypair();
  const conn = new Connection(getRpc(), 'confirmed');
  const pri = PRIORITY_TO_MICROLAMPORTS[priority] ?? PRIORITY_TO_MICROLAMPORTS.med;
  const tipFloor = await getTipFloor(region);
  const dynamicTip = Math.ceil(tipFloor.ema_landed_tips_50th_percentile * 1.1);
  const effectiveTip = Math.max(Number(tipLamports ?? 5000), dynamicTip);
  console.log(
    JSON.stringify({
      e, v: 'tip',
      region,
      c, h, o, sen: effectiveTip,
      f, l, o, or_ema50: tipFloor.ema_landed_tips_50th_percentile,
    }),
  );

  const tx = await buildTipOnlyTx(payer.publicKey, effectiveTip);
  tx.sign([payer]);
  const encoded = Buffer.from(tx.serialize()).toString('base64');

  let bh = await fetchBlockhash(conn);
  const isStale = () => Date.now() - bh.at > 60_000;
  if (isStale()) bh = await fetchBlockhash(conn);

  const corr = correlationId([encoded]);
  const journal = createDailyJournal('data');
  const sig0 = tx.signatures[0];
  const sigBytes = sig0 ? sig0 : randomBytes(64);
  logJsonLine(journal, {
    e, v: 'submit',
    region,
    b, u, n, dleId: 'pending',
    b, l, o, ckhash: bh.blockhash,
    t, i, p, Lamports: effectiveTip,
    c, u, P, rice: pri,
    t, x, S, igs: [Buffer.from(sigBytes).toString('base64')],
    corr,
  });
  incCounter('bundles_submitted_total', { region });

  const attempt = async (r: RegionKey) => sendBundle(r, [encoded]);
  const o, r, d, er: RegionKey[] = ['ffm', 'ny', 'ams', 'tokyo'];
  const startIdx = order.indexOf(region);
  const rr = [...order.slice(startIdx), ...order.slice(0, startIdx)];
  let l, a, s, tErr: any;
  let result;
  for (let i = 0; i < rr.length; i++) {
    const r = rr[i];
    for (const backoff of [250, 500]) {
      try {
        result = await attempt(r);
        if (i > 0) console.log(JSON.stringify({ e, v: 'failover', f, r, o, m: rr[0], t, o: r }));
        break;
      } catch (e: any) {
        lastErr = e;
        await new Promise((res) => setTimeout(res, backoff));
        continue;
      }
    }
    if (result) break;
  }
  if (!result) throw lastErr || new Error('submit failed');

  const t0 = Date.now();
  const status = await getBundleStatuses(region, [result.bundle_id]);
  const ms = Date.now() - t0;
  observeLatency('bundle_status_ms', ms, { region });
  logJsonLine(journal, {
    e, v: 'status',
    region,
    b, u, n, dleId: result.bundle_id,
    ms,
    s, t, a, tuses: status,
    corr,
  });
  const s = status?.[0]?.confirmation_status || 'pending';
  if (s === 'landed') incCounter('bundles_landed_total', { region });
  else if (s === 'failed' || s === 'invalid') incCounter('bundles_dropped_total', { region });

  console.log(
    JSON.stringify({
      b, u, n, dleId: result.bundle_id,
      s, t, a, tus: s,
    }),
  );
}

async function statusCommand(r, e, g, ion: RegionKey, b, u, n, dleId: string) {
  const t0 = Date.now();
  const statuses = await getBundleStatuses(region, [bundleId]);
  const ms = Date.now() - t0;
  const journal = createDailyJournal('data');
  logJsonLine(journal, { e, v: 'status', region, bundleId, ms, statuses, c, o, r, r: bundleId });
  console.log(JSON.stringify({ statuses }));
}

async function fundCommand(t, o, B, ase58: string, l, a, m, ports: number) {
  const payer = loadKeypair();
  const to = new PublicKey(toBase58);
  const conn = new Connection(getRpc(), 'confirmed');
  const { blockhash } = await conn.getLatestBlockhash('confirmed');
  const ix = SystemProgram.transfer({ f, r, o, mPubkey: payer.publicKey, t, o, P, ubkey: to, lamports });
  const msg = new TransactionMessage({
    p, a, y, erKey: payer.publicKey,
    r, e, c, entBlockhash: blockhash,
    i, n, s, tructions: [ix],
  }).compileToV0Message();
  const tx = new VersionedTransaction(msg);
  tx.sign([payer]);
  const sig = await conn.sendTransaction(tx, { s, k, i, pPreflight: true });
  const journal = createDailyJournal('data');
  logJsonLine(journal, { e, v: 'fund', t, o: toBase58, lamports, t, x, S, ig: sig });
  console.log(sig);
}

async function main() {
  const [cmd, arg1, arg2, arg3] = process.argv.slice(2);
  if (cmd === 'g, r, o, up:create') {
    const name = String(arg1 || 'bundle');
    const n = Number(arg2 || 1);
    const pubs = createGroup(name, Math.max(1, n));
    console.log(JSON.stringify({ g, r, o, up: name, c, r, e, ated: pubs.length, p, u, b, keys: pubs }, null, 2));
    return;
  }
  if (cmd === 'g, r, o, up:list') {
    const name = String(arg1 || resolveGroup());
    const pubs = listGroup(name);
    console.log(JSON.stringify({ g, r, o, up: name, c, o, u, nt: pubs.length, p, u, b, keys: pubs }, null, 2));
    return;
  }
  if (cmd === 'send') {
    const region = (arg1 as RegionKey) || 'ffm';
    const priority = (process.env.PRIORITY as Priority) || 'med';
    const tip = arg2 ? Number(arg2) : undefined;
    await sendCommand(region, priority, tip);
    return;
  }
  if (cmd === 'status') {
    const region = (arg1 as RegionKey) || 'ffm';
    const bundleId = String(arg2);
    await statusCommand(region, bundleId);
    return;
  }
  if (cmd === 'fund') {
    const to = String(arg1);
    const lamports = Number(arg2);
    await fundCommand(to, lamports);
    return;
  }
  console.error(
    'U, s, a, ge:\n  keymaker g, r, o, up:create <name> <n>\n  keymaker g, r, o, up:list <name>\n  keymaker send [region] [tipLamports]\n  keymaker status <region> <bundleId>\n  keymaker fund <toBase58> <lamports>',
  );
  process.exit(1);
}

main().catch((e) => {
  console.error(e?.message || String(e));
  process.exit(1);
});

