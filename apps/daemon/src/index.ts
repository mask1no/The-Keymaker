import "dotenv/config";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { ensureDb } from "./db";
import { db, fills } from "./db";
import { initSolana } from "./solana";
import { checkHealth } from "./health";
import { startPumpfunListener } from "./integrations/listener/heliusGrpc";
import { setListenerActive } from "./state";
import { handleTaskCreate, taskEvents } from "./task-runner";
import { cancelTask } from "./task-runner";
import { initKeystore, createFolderWithId, listFolders, createWalletInFolder, importWalletToFolder, listWallets as listFolderWallets, fundFolderFromMaster, renameFolder, getFolderDeletePreview, sweepAndDeleteFolder } from "./wallets";
import { logger } from "@keymaker/logger";
import type { ClientMsg, ServerMsg } from "@keymaker/types";
import { createSplTokenWithMetadata } from "./coin";
import { publishWithPumpFun } from "./pumpfun";
import { setRunEnabled, getRunEnabled } from "./guards";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";

const PORT = 8787;
const server = createServer();
const wss = new WebSocketServer({ server });

async function bootstrap() {
  ensureDb();
  initSolana();
  const ksPassword = process.env.KEYSTORE_PASSWORD || "";
  if (!ksPassword) throw new Error("KEYSTORE_PASSWORD not set");
  await initKeystore(ksPassword);
  // Optional GRPC listener
  if (process.env.GRPC_ENDPOINT) {
    try { await startPumpfunListener((_e:any)=>{}); setListenerActive(true); } catch { setListenerActive(false); }
  }
}
void bootstrap();

setInterval(async () => {
  const h = await checkHealth();
  const payload = JSON.stringify({ kind: "HEALTH", ...h, listenerActive: require("./state").getListenerActive() });
  wss.clients.forEach((c: any) => c.readyState === 1 && c.send(payload));
}, 5000);

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
    case "TASK_CREATE": {
      if (!s.authenticated) return fail(ws, "TASK_CREATE", "AUTH_REQUIRED");
      if (!getRunEnabled()) return fail(ws, "TASK_CREATE", "RUN_DISABLED");
      if ((msg as any).meta?.masterWallet && (msg as any).meta.masterWallet !== s.masterPubkey) return fail(ws, "TASK_CREATE", "AUTH_PUBKEY_MISMATCH");
      const id = await handleTaskCreate(msg.payload.kind, msg.payload.ca, msg.payload.params);
      send(ws, { kind: "TASK_ACCEPTED", id });
      return;
    }
    case "TASK_LIST": {
      const rows = await db.execute(`SELECT id, kind, ca, state, created_at, updated_at FROM tasks ORDER BY created_at DESC LIMIT 200`);
      send(ws, { kind: "TASKS", items: rows as any });
      return;
    }
    case "TASK_KILL": {
      if (!s.authenticated) return fail(ws, "TASK_KILL", "AUTH_REQUIRED");
      try {
        const id = (msg as any).payload?.id as string;
        if (!id) return fail(ws, "TASK_KILL", "MISSING_ID");
        cancelTask(id);
        await db.execute(`INSERT INTO task_events(task_id, state, info, at) VALUES(?, 'KILL', '{}', ?)`, [id, Date.now()]);
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
  }
}

server.listen(PORT, () => console.log(`[daemon] ws on ${PORT}`));

// Minimal HTTP endpoint(s)
server.on("request", async (req, res) => {
  try {
    if (!req.url) { res.statusCode = 404; return res.end(); }
    if (req.method === "GET" && req.url.startsWith("/pnl")) {
      // Very simple PnL scaffold: aggregate fills by ca
      // Note: For now, realized/unrealized are placeholders
      const rows = (await db.execute(
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
    res.statusCode = 404;
    res.end();
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: (e as Error).message }));
  }
});


