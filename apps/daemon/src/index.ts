import "dotenv/config";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { ensureDb } from "./db";
import { db, fills } from "./db";
import { execute } from "./db";
import { initSolana, getConn } from "./solana";
import { checkHealth } from "./health";
import { startPumpfunListener } from "./integrations/listener/heliusGrpc";
import { setListenerActive } from "./state";
import { handleTaskCreate, taskEvents } from "./task-runner";
import { cancelTask } from "./task-runner";
import { initKeystore, createFolderWithId, listFolders, createWalletInFolder, importWalletToFolder, listWallets as listFolderWallets, fundFolderFromMaster, renameFolder, getFolderDeletePreview, sweepAndDeleteFolder } from "./wallets";
import { logger } from "@keymaker/logger";
type ClientMsg = any;
type ServerMsg = any;
import { createSplTokenWithMetadata } from "./coin";
import { publishWithPumpFun } from "./pumpfun";
import { uploadImageAndJson } from "./metadata";
import { setRunEnabled, getRunEnabled } from "./guards";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { getSetting, setSetting } from "./db";
import { initSolana as reinitSolana } from "./solana";

const PORT = 8787;
const server = createServer();
const wss = new WebSocketServer({ server });
function broadcast(msg: any) {
  const payload = JSON.stringify(msg);
  wss.clients.forEach((c: any) => { try { if (c.readyState === 1) c.send(payload); } catch {} });
}
// Expose broadcaster for optional integrations (best-effort)
(globalThis as any).__keymaker_broadcast__ = broadcast;

// CA inspect cache (20s TTL)
const caInspectCache = new Map<string, { until: number; value: any }>();

async function bootstrap() {
  ensureDb();
  initSolana();
  const ksPassword = process.env.KEYSTORE_PASSWORD || "";
  if (!ksPassword) throw new Error("KEYSTORE_PASSWORD not set");
  await initKeystore(ksPassword);
  // Optional GRPC listener
  if (process.env.GRPC_ENDPOINT) {
    try {
      await startPumpfunListener((e:any)=>{ try { broadcast({ kind: "PUMP_EVENT", ...e }); } catch {} });
      setListenerActive(true);
    } catch { setListenerActive(false); }
  }
}
void bootstrap();

setInterval(async () => {
  const h = await checkHealth();
  const payload = JSON.stringify({ kind: "HEALTH", ...h, listenerActive: require("./state").getListenerActive() });
  wss.clients.forEach((c: any) => c.readyState === 1 && c.send(payload));
}, 5000);

// One-shot health transition signals
let __lastRpcOk: boolean | undefined = undefined;
setInterval(async () => {
  try {
    const h = await checkHealth();
    if (__lastRpcOk !== undefined && __lastRpcOk !== h.rpcOk) {
      const state = h.rpcOk ? "RECOVERED" : "DEGRADED";
      const payload = JSON.stringify({ kind: "HEALTH_STATE", state, at: Date.now() });
      wss.clients.forEach((c: any) => c.readyState === 1 && c.send(payload));
    }
    __lastRpcOk = h.rpcOk;
  } catch {}
}, 3000);

type Session = { nonce?: string; masterPubkey?: string; authenticated?: boolean };
const sessions = new WeakMap<any, Session>();

wss.on("connection", (ws) => {
  sessions.set(ws, {});
  const onTask = (evt: any) => {
    ws.send(JSON.stringify({ kind: "TASK_EVENT", ...evt }));
  };
  taskEvents.on("event", onTask);
  ws.on("close", () => taskEvents.off("event", onTask));
  ws.on("message", async (data) => {
    try {
      const msg = JSON.parse(data.toString());
      await handleMessage(ws, msg);
    } catch (e) {
      fail(ws, "GENERIC", (e as Error).message);
    }
  });
  // Send a health snapshot immediately on connect
  ;(async () => {
    try {
      const h = await checkHealth();
      ws.send(JSON.stringify({ kind: "HEALTH", ...h, listenerActive: require("./state").getListenerActive() }));
    } catch {}
  })();
});

function send(ws: any, m: any) { ws.send(JSON.stringify(m)); }
function ack(ws: any, ref: string) { send(ws, { kind: "ACK", ref }); }
function fail(ws: any, ref: string, error: string) { logger.error("ws-error", { ref, error }); send(ws, { kind: "ERR", error, ref }); }

async function handleMessage(ws: any, msg: ClientMsg) {
  const s = sessions.get(ws)!;
  switch (msg.kind) {
    case "AUTH_CHALLENGE": {
      const nonce = nacl.randomBytes(24);
      const nonceB58 = bs58.encode(nonce);
      s.nonce = nonceB58;
      send(ws, { kind: "AUTH_NONCE", nonce: nonceB58 });
      return;
    }
    case "AUTH_PROVE": {
      const { pubkey, signature, nonce } = msg.payload;
      if (!s.nonce || s.nonce !== nonce) return fail(ws, "AUTH_PROVE", "AUTH_BAD_NONCE");
      const message = Buffer.from(`Keymaker auth:${nonce}`);
      const sig = bs58.decode(signature);
      const pk = bs58.decode(pubkey);
      const ok = nacl.sign.detached.verify(message, sig, pk);
      if (!ok) return fail(ws, "AUTH_PROVE", "AUTH_BAD_SIGNATURE");
      s.authenticated = true;
      s.masterPubkey = pubkey;
      send(ws, { kind: "AUTH_OK", masterPubkey: pubkey });
      return;
    }
    case "FOLDER_CREATE": {
      if (!s.authenticated) return fail(ws, "FOLDER_CREATE", "AUTH_REQUIRED");
      try {
        await createFolderWithId(msg.payload.id, msg.payload.name);
      } catch (e) {
        return fail(ws, "FOLDER_CREATE", (e as Error).message || "GENERIC");
      }
      ack(ws, "FOLDER_CREATE");
      const folders = await listFolders();
      send(ws, { kind: "FOLDERS", folders });
      return;
    }
    case "FOLDER_LIST": {
      const folders = await listFolders();
      send(ws, { kind: "FOLDERS", folders });
      return;
    }
    case "FOLDER_RENAME": {
      if (!s.authenticated) return fail(ws, "FOLDER_RENAME", "AUTH_REQUIRED");
      try {
        await renameFolder(msg.payload.id, msg.payload.name);
      } catch (e) {
        return fail(ws, "FOLDER_RENAME", (e as Error).message || "GENERIC");
      }
      const folders = await listFolders();
      send(ws, { kind: "FOLDERS", folders });
      return;
    }
    case "FOLDER_DELETE_PREVIEW": {
      if (!s.authenticated) return fail(ws, "FOLDER_DELETE_PREVIEW", "AUTH_REQUIRED");
      try {
        const plan = await getFolderDeletePreview(msg.payload.id);
        send(ws, { kind: "FOLDER_DELETE_PLAN", ...plan });
      } catch (e) {
        return fail(ws, "FOLDER_DELETE_PREVIEW", (e as Error).message || "GENERIC");
      }
      return;
    }
    case "FOLDER_DELETE": {
      if (!s.authenticated) return fail(ws, "FOLDER_DELETE", "AUTH_REQUIRED");
      if (s.masterPubkey !== msg.payload.masterPubkey) return fail(ws, "FOLDER_DELETE", "AUTH_PUBKEY_MISMATCH");
      const id = msg.payload.id as string;
      try {
        const { signatures } = await sweepAndDeleteFolder({ id, masterPubkey: s.masterPubkey!, onProgress: (evt) => send(ws, { ...evt }) });
        send(ws, { kind: "SWEEP_DONE", id, signatures });
        const folders = await listFolders();
        send(ws, { kind: "FOLDERS", folders });
      } catch (e) {
        return fail(ws, "FOLDER_DELETE", (e as Error).message || "SWEEP_FAILED");
      }
      return;
    }
    case "WALLET_CREATE": {
      if (!s.authenticated) return fail(ws, "WALLET_CREATE", "AUTH_REQUIRED");
      try {
        await createWalletInFolder(msg.payload.folderId);
      } catch (e) {
        return fail(ws, "WALLET_CREATE", (e as Error).message || "GENERIC");
      }
      ack(ws, "WALLET_CREATE");
      const wsInFolder = await listFolderWallets(msg.payload.folderId);
      send(ws, { kind: "WALLETS", folderId: msg.payload.folderId, wallets: wsInFolder });
      return;
    }
    case "WALLET_IMPORT": {
      if (!s.authenticated) return fail(ws, "WALLET_IMPORT", "AUTH_REQUIRED");
      try {
        await importWalletToFolder(msg.payload.folderId, msg.payload.secretBase58);
      } catch (e) {
        return fail(ws, "WALLET_IMPORT", (e as Error).message || "INVALID_SECRET");
      }
      ack(ws, "WALLET_IMPORT");
      const wsInFolder = await listFolderWallets(msg.payload.folderId);
      send(ws, { kind: "WALLETS", folderId: msg.payload.folderId, wallets: wsInFolder });
      return;
    }
    case "FOLDER_WALLETS": {
      const wsInFolder = await listFolderWallets(msg.payload.folderId);
      send(ws, { kind: "WALLETS", folderId: msg.payload.folderId, wallets: wsInFolder });
      return;
    }
    case "FUND_WALLETS": {
      if (!s.authenticated) return fail(ws, "FUND_WALLETS", "AUTH_REQUIRED");
      if (s.masterPubkey !== msg.payload.masterPubkey) return fail(ws, "FUND_WALLETS", "AUTH_PUBKEY_MISMATCH");
      try {
        const signatures = await fundFolderFromMaster({ folderId: msg.payload.folderId, totalSol: msg.payload.totalSol, masterPubkey: s.masterPubkey! });
        send(ws, { kind: "FUND_RESULT", folderId: msg.payload.folderId, signatures });
      } catch (e) {
        fail(ws, "FUND_WALLETS", (e as Error).message);
      }
      return;
    }
    case "KILL_SWITCH": {
      if (!s.authenticated) return fail(ws, "KILL_SWITCH", "AUTH_REQUIRED");
      setRunEnabled(!!msg.payload.enabled);
      logger.warn("kill-switch", { enabled: getRunEnabled() });
      send(ws, { kind: "ACK", ref: "KILL_SWITCH" });
      return;
    }
    case "SETTINGS_GET": {
      const settings = {
        RPC_URL: process.env.RPC_URL || getSetting("RPC_URL") || "",
        GRPC_ENDPOINT: process.env.GRPC_ENDPOINT || getSetting("GRPC_ENDPOINT") || "",
        JITO_BLOCK_ENGINE: process.env.JITO_BLOCK_ENGINE || getSetting("JITO_BLOCK_ENGINE") || "",
        RUN_ENABLED: getRunEnabled()
      };
      send(ws, { kind: "SETTINGS", settings });
      return;
    }
    case "SETTINGS_SET": {
      if (!s.authenticated) return fail(ws, "SETTINGS_SET", "AUTH_REQUIRED");
      try {
        const entries = (msg as any).payload?.entries as Array<{ key: string; value: string }>;
        if (!Array.isArray(entries)) return fail(ws, "SETTINGS_SET", "BAD_PARAMS");
        for (const { key, value } of entries) {
          if (!key) continue;
          setSetting(key, value);
          if (key === "RPC_URL") { process.env.RPC_URL = value; try { reinitSolana(); } catch {} }
          if (key === "JITO_BLOCK_ENGINE") { process.env.JITO_BLOCK_ENGINE = value; }
          if (key === "GRPC_ENDPOINT") {
            process.env.GRPC_ENDPOINT = value;
            // best-effort: if set and previously blank, start listener
            if (value) { try { await startPumpfunListener((e:any)=>{ try { broadcast({ kind: "PUMP_EVENT", ...e }); } catch {} }); setListenerActive(true); } catch { setListenerActive(false); } }
          }
        }
        send(ws, { kind: "ACK", ref: "SETTINGS_SET" });
        const settings = {
          RPC_URL: process.env.RPC_URL || getSetting("RPC_URL") || "",
          GRPC_ENDPOINT: process.env.GRPC_ENDPOINT || getSetting("GRPC_ENDPOINT") || "",
          JITO_BLOCK_ENGINE: process.env.JITO_BLOCK_ENGINE || getSetting("JITO_BLOCK_ENGINE") || "",
          RUN_ENABLED: getRunEnabled()
        };
        send(ws, { kind: "SETTINGS", settings });
      } catch (e) {
        return fail(ws, "SETTINGS_SET", (e as Error).message || "GENERIC");
      }
      return;
    }
    case "TASK_CREATE": {
      if (!s.authenticated) return fail(ws, "TASK_CREATE", "AUTH_REQUIRED");
      if (!getRunEnabled()) return fail(ws, "TASK_CREATE", "RUN_DISABLED");
      if ((msg as any).meta?.masterWallet && (msg as any).meta.masterWallet !== s.masterPubkey) return fail(ws, "TASK_CREATE", "AUTH_PUBKEY_MISMATCH");
      const id = await handleTaskCreate(msg.payload.kind, msg.payload.ca, msg.payload.params);
      send(ws, { kind: "TASK_ACCEPTED", id });
      return;
    }
    case "TASK_LIST": {
      const ca = (msg as any)?.payload?.ca as string | undefined;
      const rows = await execute(
        `SELECT t.id, t.kind, t.ca, t.state, t.created_at, t.updated_at,
                (SELECT e.state FROM task_events e WHERE e.task_id = t.id ORDER BY e.at DESC LIMIT 1) as last_event
           FROM tasks t ${ca ? "WHERE t.ca = ?" : ""}
           ORDER BY t.created_at DESC LIMIT 200`,
        ca ? [ca] : []
      );
      send(ws, { kind: "TASKS", items: rows as any });
      return;
    }
    case "TASK_KILL": {
      if (!s.authenticated) return fail(ws, "TASK_KILL", "AUTH_REQUIRED");
      try {
        const id = (msg as any).payload?.id as string;
        if (!id) return fail(ws, "TASK_KILL", "MISSING_ID");
        cancelTask(id);
        await execute(`INSERT INTO task_events(task_id, state, info, at) VALUES(?, 'KILL', '{}', ?)`, [id, Date.now()]);
        send(ws, { kind: "ACK", ref: "TASK_KILL" });
      } catch (e) {
        return fail(ws, "TASK_KILL", (e as Error).message || "GENERIC");
      }
      return;
    }
    case "COIN_CREATE_SPL": {
      if (!s.authenticated) return fail(ws, "COIN_CREATE_SPL", "AUTH_REQUIRED");
      const { name, symbol, decimals, metadataUri, payerFolderId, payerWalletPubkey } = msg.payload as any;
      const payerPubkey = payerWalletPubkey ?? s.masterPubkey!;
      if (payerWalletPubkey && payerWalletPubkey !== s.masterPubkey) return fail(ws, "COIN_CREATE_SPL", "AUTH_PUBKEY_MISMATCH");
      try {
        const { mint, sig } = await createSplTokenWithMetadata({ name, symbol, decimals, metadataUri, payerPubkey });
        send(ws, { kind: "COIN_CREATED", mint, sig } as ServerMsg);
      } catch (e) {
        fail(ws, "COIN_CREATE_SPL", (e as Error).message);
      }
      return;
    }
    case "UPLOAD_METADATA": {
      if (!s.authenticated) return fail(ws, "UPLOAD_METADATA", "AUTH_REQUIRED");
      try {
        const r = await uploadImageAndJson((msg as any).payload || {});
        send(ws, { kind: "METADATA_UPLOADED", ...r } as any);
      } catch (e) {
        fail(ws, "UPLOAD_METADATA", (e as Error).message);
      }
      return;
    }
    case "COIN_PUBLISH_PUMPFUN": {
      if (!s.authenticated) return fail(ws, "COIN_PUBLISH_PUMPFUN", "AUTH_REQUIRED");
      const { mint, payerFolderId, payerWalletPubkey } = msg.payload as any;
      const payerPubkey = payerWalletPubkey ?? s.masterPubkey!;
      if (payerWalletPubkey && payerWalletPubkey !== s.masterPubkey) return fail(ws, "COIN_PUBLISH_PUMPFUN", "AUTH_PUBKEY_MISMATCH");
      try {
        const { sig } = await publishWithPumpFun({ mint, payerPubkey });
        send(ws, { kind: "COIN_PUBLISHED", mint, sig } as ServerMsg);
      } catch (e) {
        fail(ws, "COIN_PUBLISH_PUMPFUN", (e as Error).message);
      }
      return;
    }
    case "CA_INSPECT": {
      try {
        const ca = String((msg as any)?.payload?.ca || "");
        try { new PublicKey(ca); } catch { return fail(ws, "CA_INSPECT", "BAD_MINT"); }
        const now = Date.now();
        const cached = caInspectCache.get(ca);
        if (cached && cached.until > now) { send(ws, { kind: "CA_STATUS", ...cached.value }); return; }
        // Load mint info (decimals best-effort)
        let decimals: number | undefined;
        try {
          const acc = await getConn().getParsedAccountInfo(new PublicKey(ca));
          const parsed: any = (acc as any)?.value?.data?.parsed;
          decimals = Number(parsed?.info?.decimals);
        } catch {}
        // Tiny Jupiter quote to detect routing readiness
        let ammReady = false;
        try {
          const base = process.env.JUP_API_BASE || "https://quote-api.jup.ag/v6";
          const url = `${base}/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=${encodeURIComponent(ca)}&amount=100000&slippageBps=50&onlyDirectRoutes=false`;
          const r = await fetch(url);
          if (r.ok) {
            const j: any = await r.json();
            ammReady = Array.isArray(j?.data) ? j.data.length > 0 : !!j?.routePlan?.length;
          }
        } catch {}
        const value = { kind: "CA_STATUS", ca, ammReady, decimals };
        caInspectCache.set(ca, { until: now + 20_000, value });
        send(ws, value as any);
      } catch (e) {
        fail(ws, "CA_INSPECT", (e as Error).message || "INSPECT_FAIL");
      }
      return;
    }
    case "MARKET_ORDER": {
      if (!s.authenticated) return fail(ws, "MARKET_ORDER", "AUTH_REQUIRED");
      const p = (msg as any)?.payload || {};
      const ca = String(p.ca || "");
      const side = String(p.side || "BUY").toUpperCase();
      const folderId = String(p.folderId || "");
      const walletMode = String(p.walletMode || "ONE");
      const amountSol = Number(p.amountSol || 0);
      const amountTokens = Number(p.amountTokens || 0);
      const percentTokens = Number(p.percentTokens || 0);
      const slippageBps = Number(p.slippageBps || 50);
      try {
        try { new PublicKey(ca); } catch { return fail(ws, "MARKET_ORDER", "BAD_MINT"); }
        // Figure out wallets to act on
        const wsInFolder = await execute(`SELECT pubkey FROM wallets WHERE folder_id = ?`, [folderId]) as any[];
        const wallets: string[] = walletMode === "ONE" ? [String(wsInFolder[0]?.pubkey || s.masterPubkey || "")] : wsInFolder.map((w:any)=> String(w.pubkey));
        if (!wallets.length) return fail(ws, "MARKET_ORDER", "NO_WALLETS");
        // Per-wallet sequential execution for simplicity
        for (const userPk of wallets) {
          send(ws, { kind: "ORDER_EVENT", state: "PREP", walletPubkey: userPk });
          try {
            let vtxBase64: string | null = null;
            if (side === "BUY") {
              const base = process.env.JUP_API_BASE || "https://quote-api.jup.ag/v6";
              const amountLamports = Math.floor(amountSol * 1e9);
              const qUrl = `${base}/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=${encodeURIComponent(ca)}&amount=${amountLamports}&slippageBps=${slippageBps}`;
              const qRes = await fetch(qUrl);
              if (!qRes.ok) throw new Error("JUP_QUOTE_FAIL");
              const quote = await qRes.json();
              const sRes = await fetch(`${base}/swap`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ quoteResponse: quote, userPublicKey: userPk, wrapAndUnwrapSol: true, asLegacyTransaction: false }) });
              if (!sRes.ok) throw new Error("JUP_SWAP_FAIL");
              const sJ = await sRes.json();
              vtxBase64 = String(sJ.swapTransaction || "");
            } else {
              // SELL: exact-in token amount or percentTokens
              let tokensInAtomic = 0n;
              if (amountTokens > 0) {
                // Fetch decimals to convert
                let decimals = 6;
                try {
                  const acc = await getConn().getParsedAccountInfo(new PublicKey(ca));
                  const parsed: any = (acc as any)?.value?.data?.parsed;
                  decimals = Number(parsed?.info?.decimals || 6);
                } catch {}
                tokensInAtomic = BigInt(Math.floor(amountTokens * 10 ** decimals));
              } else if (percentTokens > 0) {
                // Fetch token balance and take percent
                try {
                  const owner = new PublicKey(userPk);
                  const accs = await getConn().getParsedTokenAccountsByOwner(owner, { mint: new PublicKey(ca) });
                  const info: any = accs.value[0]?.account?.data?.parsed?.info?.tokenAmount;
                  if (info) {
                    const rawStr = info.amount as string;
                    const raw = BigInt(rawStr);
                    tokensInAtomic = (raw * BigInt(Math.floor(percentTokens))) / BigInt(100);
                  }
                } catch {}
              }
              if (tokensInAtomic <= 0n) throw new Error("NO_TOKENS");
              const base = process.env.JUP_API_BASE || "https://quote-api.jup.ag/v6";
              const qUrl = `${base}/quote?inputMint=${encodeURIComponent(ca)}&outputMint=So11111111111111111111111111111111111111112&amount=${tokensInAtomic.toString()}&slippageBps=${slippageBps}`;
              const qRes = await fetch(qUrl);
              if (!qRes.ok) throw new Error("JUP_QUOTE_FAIL");
              const quote = await qRes.json();
              const sRes = await fetch(`${base}/swap`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ quoteResponse: quote, userPublicKey: userPk, wrapAndUnwrapSol: true, asLegacyTransaction: false }) });
              if (!sRes.ok) throw new Error("JUP_SWAP_FAIL");
              const sJ = await sRes.json();
              vtxBase64 = String(sJ.swapTransaction || "");
            }
            if (!vtxBase64) throw new Error("BUILD_FAIL");
            send(ws, { kind: "ORDER_EVENT", state: "BUILD", walletPubkey: userPk });
            // Deserialize, allowlist, sign, submit
            const buf = Buffer.from(vtxBase64, "base64");
            const { VersionedTransaction } = await import("@solana/web3.js");
            const vtx = VersionedTransaction.deserialize(buf);
            try { (await import("./guards")).programAllowlistCheck([vtx]); } catch {}
            const kp = await (await import("./secrets")).getKeypairForPubkey(userPk);
            if (!kp) throw new Error("PAYER_NOT_AVAILABLE");
            vtx.sign([kp]);
            send(ws, { kind: "ORDER_EVENT", state: "SUBMIT", walletPubkey: userPk });
            const { submitBundle } = await import("./solana");
            const r = await submitBundle([vtx]);
            const sig = String((r.sigs || [])[0] || "");
            send(ws, { kind: "ORDER_EVENT", state: "CONFIRM", walletPubkey: userPk, sig });
            try { await (await import("./solana")).confirmSigs(r.sigs); } catch {}
            send(ws, { kind: "ORDER_EVENT", state: "DONE", walletPubkey: userPk, sig });
          } catch (e) {
            send(ws, { kind: "ORDER_EVENT", state: "FAIL", walletPubkey: userPk, error: (e as Error).message || "GENERIC" });
          }
        }
      } catch (e) {
        return fail(ws, "MARKET_ORDER", (e as Error).message || "GENERIC");
      }
      return;
    }
  }
}

server.listen(PORT, () => console.log(`[daemon] ws on ${PORT}`));

// Minimal HTTP endpoint(s)
server.on("request", async (req, res) => {
  try {
    if (!req.url) { res.statusCode = 404; return res.end(); }
    if (req.method === "GET" && req.url.startsWith("/positions")) {
      const u = new URL(req.url, "http://localhost");
      const ca = String(u.searchParams.get("ca") || "");
      const folderId = String(u.searchParams.get("folder") || "");
      if (!ca || !folderId) { res.statusCode = 400; return res.end(JSON.stringify({ error: "BAD_PARAMS" })); }
      try {
        const wsInFolder = await execute(`SELECT pubkey FROM wallets WHERE folder_id = ?`, [folderId]) as any[];
        const out: any[] = [];
        for (const w of wsInFolder) {
          const pubkey = String(w.pubkey);
          let solLamports = 0;
          let tokenUi = 0;
          let lastFillTs = 0;
          try { solLamports = await getConn().getBalance(new PublicKey(pubkey)); } catch {}
          try {
            const owner = new PublicKey(pubkey);
            const accs = await getConn().getParsedTokenAccountsByOwner(owner, { mint: new PublicKey(ca) });
            const info: any = accs.value[0]?.account?.data?.parsed?.info?.tokenAmount;
            if (info) tokenUi = Number(info.uiAmount || 0);
          } catch {}
          try {
            const r = await execute(`SELECT MAX(at) as at FROM fills WHERE ca = ? AND wallet_pubkey = ?`, [ca, pubkey]) as any[];
            lastFillTs = Number((r[0] || {}).at || 0);
          } catch {}
          out.push({ pubkey, solLamports, tokenUi, lastFillTs });
        }
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify(out));
        return;
      } catch (e) {
        res.statusCode = 500;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ error: (e as Error).message }));
        return;
      }
    }
    if (req.method === "GET" && req.url.startsWith("/pnl")) {
      // Very simple PnL scaffold: aggregate fills by ca
      // Note: For now, realized/unrealized are placeholders
      const rows = (await execute(
        // Group fills by CA and wallet; aggregate fees
        `SELECT ca, wallet_pubkey, COUNT(*) as fills, COALESCE(SUM(fee_lamports),0) as fees, COALESCE(SUM(tip_lamports),0) as tips FROM fills GROUP BY ca, wallet_pubkey`
      )) as any;
      const byCa: Record<string, any> = {};
      for (const r of rows) {
        if (!byCa[r.ca]) byCa[r.ca] = { ca: r.ca, positions: [], totals: { fills: 0, feesLamports: 0, tipsLamports: 0 } };
        byCa[r.ca].positions.push({ wallet: r.wallet_pubkey, fills: Number(r.fills), feesLamports: Number(r.fees), tipsLamports: Number(r.tips) });
        byCa[r.ca].totals.fills += Number(r.fills);
        byCa[r.ca].totals.feesLamports += Number(r.fees);
        byCa[r.ca].totals.tipsLamports += Number(r.tips);
      }
      const payload = { items: Object.values(byCa) };
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify(payload));
      return;
    }
    if (req.method === "GET" && req.url.startsWith("/stats")) {
      // KPIs: coins (distinct CAs), fillsToday, earningsToday (fees+tips), volume24h (count)
      const now = Date.now();
      const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
      const dayTs = startOfDay.getTime();
      const rowsAll = (await execute(`SELECT COUNT(DISTINCT ca) as coins FROM fills`)) as any;
      const rowsToday = (await execute(`SELECT COUNT(1) as c, COALESCE(SUM(fee_lamports),0) as fees, COALESCE(SUM(tip_lamports),0) as tips FROM fills WHERE at >= ?`, [dayTs])) as any;
      const rows24h = (await execute(`SELECT COUNT(1) as c FROM fills WHERE at >= ?`, [now - 24*3600*1000])) as any;
      const recent = (await execute(`SELECT ca, at FROM fills WHERE at >= ? ORDER BY at DESC LIMIT 1000`, [now - 2*3600*1000])) as any[];
      const coins = Number((rowsAll as any)[0]?.coins || 0);
      const fillsToday = Number((rowsToday as any)[0]?.c || 0);
      const earningsToday = -1 * (Number((rowsToday as any)[0]?.fees || 0) + Number((rowsToday as any)[0]?.tips || 0));
      const volume24h = Number((rows24h as any)[0]?.c || 0);
      // Build two short sparklines over last 60 minutes in 12 buckets (5m)
      const buckets = 12;
      const windowMs = 60 * 60 * 1000;
      const bucketMs = Math.floor(windowMs / buckets);
      const volumeSeries = new Array(buckets).fill(0);
      const coinSeries = new Array(buckets).fill(0);
      const seenByBucket: Array<Set<string>> = new Array(buckets).fill(0).map(()=> new Set<string>());
      for (const r of recent) {
        const dt = now - Number(r.at || 0);
        if (dt < 0 || dt > windowMs) continue;
        const idx = Math.max(0, Math.min(buckets - 1, Math.floor((windowMs - dt) / bucketMs)));
        volumeSeries[idx] += 1;
        seenByBucket[idx].add(String(r.ca));
      }
      for (let i = 0; i < buckets; i++) coinSeries[i] = seenByBucket[i].size;
      // Minimal recent mints list (latest distinct CAs)
      const mints = Array.from(new Set(recent.map((r:any)=> String(r.ca)))).slice(0, 10);
      const payload = { coins, fillsToday, earningsToday, volume24h, series: { volume: volumeSeries, coins: coinSeries }, mints };
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify(payload));
      return;
    }
    res.statusCode = 404;
    res.end();
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: (e as Error).message }));
  }
});


