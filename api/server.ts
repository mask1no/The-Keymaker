import 'tsconfig-paths/register';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env, requireEnv } from '../lib/core/env';
import { Connection, Keypair, VersionedTransaction, PublicKey, SystemProgram, TransactionMessage } from '@solana/web3.js';
import { buildJupiterSwapTx, buildJupiterSellTx } from '../lib/core/src/jupiterAdapter';
import { loadKeypairsForGroup } from '../lib/server/keystoreLoader';
import { getWalletGroup } from '../lib/server/walletGroups';
import { submitJitoTurbo } from '../lib/server/jitoService';
import { unlock as ksUnlock, lock as ksLock, createWallet as ksCreate, importWallet as ksImport, listWallets as ksList } from '../lib/keys/keystore';
import { listTrades, aggregatePnL } from '../lib/db/sqlite';
import { getTipFloor } from '../lib/server/jitoService';
import { getMint } from '@solana/spl-token';

const PORT = 3001;

async function buildServer() {
  // Validate env early
  requireEnv('HELIUS_RPC_URL');
  env.public; // ensure NEXT_PUBLIC_API_BASE is valid if present

  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: (origin, cb) => {
      const allowed = 'http://localhost:3000';
      if (!origin || origin === allowed) cb(null, true);
      else cb(new Error('CORS not allowed'), false);
    },
    credentials: true,
  });

  app.get('/api/health', async () => ({ ok: true }));
  app.get('/api/health', async () => {
    try {
      const conn = getConnection();
      const slot = await conn.getSlot('processed');
      let tip: number | null = null;
      try {
        const tf = await getTipFloor('ffm' as any);
        tip = tf?.max || null;
      } catch {}
      return { ok: true, rpcSlot: slot, jitoTipFloor: tip };
    } catch {
      return { ok: false };
    }
  });

  function getConnection(): Connection {
    const rpc = requireEnv('HELIUS_RPC_URL');
    return new Connection(rpc, 'confirmed');
  }

  type EngineMode = 'JITO' | 'RPC';
  app.post('/api/engine/bundle', async (req, rep) => {
    try {
      const body = (req.body || {}) as {
        actions: Array<'CREATE' | 'FUND' | 'BUY' | 'SELL'>;
        groupId: string;
        amountLamports?: number;
        mint?: string;
        slippageBps?: number;
        tipLamports?: number;
        mode?: EngineMode;
        region?: 'ffm' | 'ams' | 'ny' | 'tokyo';
      };

      const mode: EngineMode = (body.mode || 'RPC').toUpperCase() as EngineMode;
      const actions = Array.isArray(body.actions) ? body.actions : [];
      if (!actions.length) return rep.code(400).send({ error: 'missing_actions' });

      const group = getWalletGroup(body.groupId);
      if (!group || !group.masterWallet) return rep.code(404).send({ error: 'group_not_found' });
      const wallets = group.executionWallets || [];
      if (!wallets.length) return rep.code(400).send({ error: 'no_execution_wallets' });
      const keypairs = await loadKeypairsForGroup(group.name, wallets, group.masterWallet);
      if (!keypairs.length) return rep.code(500).send({ error: 'failed_to_load_keypairs' });

      const rpc = getConnection();
      const signatures: string[] = [];

      for (const action of actions) {
        if (action === 'BUY') {
          if (!body.mint || !body.amountLamports) {
            return rep.code(400).send({ error: 'missing_buy_params' });
          }
          for (const kp of keypairs) {
            const vtx = await buildJupiterSwapTx({
              wallet: kp,
              inputMint: 'So11111111111111111111111111111111111111112',
              outputMint: body.mint,
              amountSol: body.amountLamports / 1e9,
              slippageBps: body.slippageBps ?? 150,
            });
            vtx.sign([kp]);
            if (mode === 'JITO') {
              const tip = (env.server.JITO_TIP_LAMPORTS_DEFAULT_NUM || 50_000) as number;
              const res = await submitJitoTurbo({
                region: (body.region as any) || 'ffm',
                signedTxBase64: Buffer.from(vtx.serialize()).toString('base64'),
                tipLamports: body.tipLamports ?? tip,
                simulateFirst: false,
              });
              if (res.ok) {
                if (res.signature) signatures.push(res.signature);
              } else {
                return rep.code(500).send({ error: res.error });
              }
            } else {
              const sig = await rpc.sendRawTransaction(vtx.serialize(), {
                skipPreflight: false,
                maxRetries: 3,
              });
              await rpc.confirmTransaction(sig, 'confirmed');
              signatures.push(sig);
            }
          }
        } else if (action === 'SELL') {
          if (!body.mint) return rep.code(400).send({ error: 'missing_sell_params' });
          const mintKey = new PublicKey(body.mint);
          for (const kp of keypairs) {
            // Get token balance
            const tokenAccounts = await rpc.getParsedTokenAccountsByOwner(kp.publicKey, {
              mint: mintKey,
            });
            const balRaw = tokenAccounts.value?.[0]?.account?.data?.parsed?.info?.tokenAmount?.amount;
            const amountTokens = Math.max(0, Number(balRaw || 0));
            if (!amountTokens) continue;
            const vtx = await buildJupiterSellTx({
              wallet: kp,
              inputMint: body.mint,
              outputMint: 'So11111111111111111111111111111111111111112',
              amountTokens,
              slippageBps: body.slippageBps ?? 200,
            });
            vtx.sign([kp]);
            if (mode === 'JITO') {
              const tip = (env.server.JITO_TIP_LAMPORTS_DEFAULT_NUM || 50_000) as number;
              const res = await submitJitoTurbo({
                region: (body.region as any) || 'ffm',
                signedTxBase64: Buffer.from(vtx.serialize()).toString('base64'),
                tipLamports: body.tipLamports ?? tip,
                simulateFirst: false,
              });
              if (res.ok) {
                if (res.signature) signatures.push(res.signature);
              } else {
                return rep.code(500).send({ error: res.error });
              }
            } else {
              const sig = await rpc.sendRawTransaction(vtx.serialize(), {
                skipPreflight: false,
                maxRetries: 3,
              });
              await rpc.confirmTransaction(sig, 'confirmed');
              signatures.push(sig);
            }
          }
        } else {
          return rep.code(400).send({ error: `unsupported_action:${action}` });
        }
      }

      return rep.send({ status: 'ok', mode, txSignatures: signatures });
    } catch (e: any) {
      return rep.code(500).send({ error: e?.message || 'engine_failed' });
    }
  });

  // Wallets
  let idleTimer: NodeJS.Timeout | null = null;
  const IDLE_MS = 5 * 60 * 1000;
  function bumpIdle() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      try {
        ksLock();
      } catch {}
    }, IDLE_MS);
  }
  app.post('/api/wallets/create', async (req, rep) => {
    try {
      const { passphrase, label } = (req.body as any) || {};
      if (!passphrase || String(passphrase).length < 12)
        return rep.code(400).send({ error: 'weak_or_missing_passphrase' });
      ksUnlock(passphrase);
      const w = ksCreate(label);
      bumpIdle();
      return { wallet: w };
    } catch (e: any) {
      return rep.code(500).send({ error: e?.message || 'create_failed' });
    }
  });
  app.post('/api/wallets/import', async (req, rep) => {
    try {
      const { passphrase, secret, label } = (req.body as any) || {};
      if (!passphrase || String(passphrase).length < 12 || !secret)
        return rep.code(400).send({ error: 'bad_request' });
      ksUnlock(passphrase);
      const w = ksImport(secret, label);
      bumpIdle();
      return { wallet: w };
    } catch (e: any) {
      return rep.code(500).send({ error: e?.message || 'import_failed' });
    }
  });
  app.post('/api/wallets/list', async (req, _rep) => {
    // Optional unlock if provided (refresh idle timer)
    try {
      const { passphrase } = (req.body as any) || {};
      if (passphrase && String(passphrase).length >= 12) ksUnlock(passphrase);
      bumpIdle();
    } catch {}
    return { wallets: ksList() };
  });

  // Funding
  app.post('/api/funding/execute', async (req, rep) => {
    try {
      const body = (req.body || {}) as {
        groupId: string;
        totalLamports?: number;
        perWalletLamports?: number;
        strategy?: 'equal' | 'random';
        jitterPct?: number;
      };

      const group = getWalletGroup(body.groupId);
      if (!group || !group.masterWallet) return rep.code(404).send({ error: 'group_not_found' });
      const dests = group.executionWallets || [];
      if (!dests.length) return rep.code(400).send({ error: 'no_wallets' });

      const strategy = body.strategy || 'equal';
      const jitter = Math.max(0, Math.min(50, body.jitterPct ?? 10));
      const amounts: number[] = (() => {
        if (body.perWalletLamports) return Array(dests.length).fill(body.perWalletLamports);
        const total = Math.max(0, body.totalLamports || 0);
        if (strategy === 'equal') return Array(dests.length).fill(Math.floor(total / dests.length));
        // random partition with jitter
        const base = Math.floor(total / dests.length);
        return dests.map(() => {
          const delta = Math.floor((base * jitter) / 100);
          const sign = Math.random() < 0.5 ? -1 : 1;
          return Math.max(0, base + sign * Math.floor(Math.random() * (delta + 1)));
        });
      })();

      const rpc = getConnection();
      // Load master keypair
      const kps = await loadKeypairsForGroup(group.name, [group.masterWallet], group.masterWallet);
      const master = kps[0];
      if (!master) return rep.code(500).send({ error: 'master_keypair_not_found' });

      const blockhash = await rpc.getLatestBlockhash('finalized');
      const results: Array<{ wallet: string; signature?: string; error?: string }> = [];
      for (let i = 0; i < dests.length; i++) {
        const to = dests[i];
        const lamports = amounts[i] || 0;
        if (!lamports) continue;
        try {
          const ix = SystemProgram.transfer({
            fromPubkey: master.publicKey,
            toPubkey: new PublicKey(to),
            lamports,
          });
          const msg = new TransactionMessage({
            payerKey: master.publicKey,
            recentBlockhash: blockhash.blockhash,
            instructions: [ix],
          }).compileToV0Message();
          const tx = new VersionedTransaction(msg);
          tx.sign([master]);
          const sig = await rpc.sendTransaction(tx, { skipPreflight: false });
          results.push({ wallet: to, signature: sig });
          await new Promise((r) => setTimeout(r, 10 + Math.random() * 30));
        } catch (e: any) {
          results.push({ wallet: to, error: e?.message || 'send_failed' });
        }
      }
      return rep.send({ ok: true, count: results.length, results });
    } catch (e: any) {
      return rep.code(500).send({ error: e?.message || 'funding_failed' });
    }
  });

  // Engine bundle endpoint (JITO/RPC selection is deferred to implementation)
  app.post('/api/engine/bundle', async (_req, rep) => {
    rep.code(501).send({ error: 'not_implemented' });
  });

  // Sells
  app.post('/api/sell/all', async (req, rep) => {
    try {
      const body = (req.body || {}) as {
        groupId: string;
        mint: string;
        mode?: EngineMode;
        tipLamports?: number;
        region?: 'ffm' | 'ams' | 'ny' | 'tokyo';
      };
      const mode: EngineMode = (body.mode || 'RPC').toUpperCase() as EngineMode;
      const group = getWalletGroup(body.groupId);
      if (!group || !group.masterWallet) return rep.code(404).send({ error: 'group_not_found' });
      const wallets = group.executionWallets || [];
      const keypairs = await loadKeypairsForGroup(group.name, wallets, group.masterWallet);
      const rpc = getConnection();
      const signatures: string[] = [];
      for (const kp of keypairs) {
        const tokenAccounts = await rpc.getParsedTokenAccountsByOwner(kp.publicKey, {
          mint: new PublicKey(body.mint),
        });
        const balRaw = tokenAccounts.value?.[0]?.account?.data?.parsed?.info?.tokenAmount?.amount;
        const amountTokens = Math.max(0, Number(balRaw || 0));
        if (!amountTokens) continue;
        const vtx = await buildJupiterSellTx({
          wallet: kp,
          inputMint: body.mint,
          outputMint: 'So11111111111111111111111111111111111111112',
          amountTokens,
          slippageBps: 200,
        });
        vtx.sign([kp]);
        if (mode === 'JITO') {
          const tip = (env.server.JITO_TIP_LAMPORTS_DEFAULT_NUM || 50_000) as number;
          const res = await submitJitoTurbo({
            region: (body.region as any) || 'ffm',
            signedTxBase64: Buffer.from(vtx.serialize()).toString('base64'),
            tipLamports: body.tipLamports ?? tip,
            simulateFirst: false,
          });
          if (res.ok && res.signature) signatures.push(res.signature);
        } else {
          const sig = await rpc.sendRawTransaction(vtx.serialize(), { skipPreflight: false, maxRetries: 3 });
          await rpc.confirmTransaction(sig, 'confirmed');
          signatures.push(sig);
        }
      }
      return { status: 'ok', txSignatures: signatures };
    } catch (e: any) {
      return rep.code(500).send({ error: e?.message || 'sell_failed' });
    }
  });
  app.post('/api/sell/percent', async (req, rep) => {
    try {
      const body = (req.body || {}) as { groupId: string; mint: string; percent: number; mode?: EngineMode };
      const mode: EngineMode = (body.mode || 'RPC').toUpperCase() as EngineMode;
      const group = getWalletGroup(body.groupId);
      if (!group || !group.masterWallet) return rep.code(404).send({ error: 'group_not_found' });
      const wallets = group.executionWallets || [];
      const keypairs = await loadKeypairsForGroup(group.name, wallets, group.masterWallet);
      const rpc = getConnection();
      const signatures: string[] = [];
      for (const kp of keypairs) {
        const tokenAccounts = await rpc.getParsedTokenAccountsByOwner(kp.publicKey, {
          mint: new PublicKey(body.mint),
        });
        const balRaw = tokenAccounts.value?.[0]?.account?.data?.parsed?.info?.tokenAmount?.amount;
        const balance = Math.max(0, Number(balRaw || 0));
        const amountTokens = Math.floor((balance * Math.max(0, Math.min(100, body.percent || 0))) / 100);
        if (!amountTokens) continue;
        const vtx = await buildJupiterSellTx({
          wallet: kp,
          inputMint: body.mint,
          outputMint: 'So11111111111111111111111111111111111111112',
          amountTokens,
          slippageBps: 200,
        });
        vtx.sign([kp]);
        if (mode === 'JITO') {
          const tip = (env.server.JITO_TIP_LAMPORTS_DEFAULT_NUM || 50_000) as number;
          const res = await submitJitoTurbo({
            region: 'ffm' as any,
            signedTxBase64: Buffer.from(vtx.serialize()).toString('base64'),
            tipLamports: tip,
            simulateFirst: false,
          });
          if (res.ok && res.signature) signatures.push(res.signature);
        } else {
          const sig = await rpc.sendRawTransaction(vtx.serialize(), { skipPreflight: false, maxRetries: 3 });
          await rpc.confirmTransaction(sig, 'confirmed');
          signatures.push(sig);
        }
      }
      return { status: 'ok', txSignatures: signatures };
    } catch (e: any) {
      return rep.code(500).send({ error: e?.message || 'sell_failed' });
    }
  });
  app.post('/api/sell/at-time', async (req, rep) => {
    try {
      const body = (req.body || {}) as { groupId: string; mint: string; at: number; percent?: number; mode?: EngineMode };
      const delay = Math.max(0, body.at - Date.now());
      setTimeout(async () => {
        try {
          await app.inject({
            method: 'POST',
            url: '/api/sell/percent',
            payload: { groupId: body.groupId, mint: body.mint, percent: body.percent ?? 100, mode: body.mode || 'RPC' },
          });
        } catch {}
      }, delay);
      return { scheduledInMs: delay };
    } catch (e: any) {
      return rep.code(500).send({ error: e?.message || 'schedule_failed' });
    }
  });

  // History / PnL
  app.get('/api/history', async () => {
    const items = listTrades({ limit: 500 });
    return { items };
  });
  app.get('/api/pnl', async (req) => {
    // Minimal: no live price cache; pass empty map for unrealized
    const agg = aggregatePnL({});
    const format = (req.query as any)?.format;
    if (format === 'csv') {
      const rows = [['buys', 'sells', 'fees', 'realized', 'unrealized', 'net']].concat([
        [
          agg.buysLamports,
          agg.sellsLamports,
          agg.feesLamports,
          agg.realizedLamports,
          agg.unrealizedLamports,
          agg.netLamports,
        ],
      ]);
      const csv = rows.map((r) => r.join(',')).join('\n');
      return { csv };
    }
    return agg;
  });

  // Market data (minimal): supply from mint, price from Jupiter price API
  app.get('/api/market/:mint', async (req, rep) => {
    try {
      const mint = (req.params as any)?.mint as string;
      if (!mint) return rep.code(400).send({ error: 'missing_mint' });
      const conn = getConnection();
      // Supply
      const mintInfo = await getMint(conn, new PublicKey(mint));
      const supply = Number(mintInfo.supply) / 10 ** mintInfo.decimals;
      // Price (USD)
      const url = new URL('https://price.jup.ag/v6/price');
      url.searchParams.set('ids', mint);
      const r = await fetch(url);
      const j = (await r.json()) as any;
      const price = j?.data?.[mint]?.price as number | undefined;
      const marketCap = price && supply ? price * supply : undefined;
      return { mint, price, marketCap, lastUpdated: new Date().toISOString() };
    } catch (e: any) {
      return rep.code(500).send({ error: e?.message || 'market_failed' });
    }
  });

  return app;
}

buildServer()
  .then((app) => app.listen({ port: PORT, host: '0.0.0.0' }))
  .then((addr) => {
    // eslint-disable-next-line no-console
    console.log(`API listening on ${addr}`);
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });


