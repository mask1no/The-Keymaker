import "dotenv/config";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { ensureDb } from "./db";
import { initSolana } from "./solana";
import { checkHealth } from "./health";
import { handleTaskCreate, taskEvents } from "./task-runner";
import { initKeystore, createFolderWithId, listFolders, createWalletInFolder, importWalletToFolder, listWallets as listFolderWallets, fundFolderFromMaster } from "./wallets";

const PORT = 8787;
const server = createServer();
const wss = new WebSocketServer({ server });

ensureDb();
initSolana();
// init keystore
const ksPassword = process.env.KEYSTORE_PASSWORD || "";
if (!ksPassword) throw new Error("KEYSTORE_PASSWORD not set");
await initKeystore(ksPassword);

setInterval(async () => {
  const h = await checkHealth();
  const payload = JSON.stringify({ kind: "HEALTH", ...h });
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
function fail(ws: any, ref: string, error: string) { send(ws, { kind: "ERR", error, ref }); }

async function handleMessage(ws: any, msg: any) {
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
      if (!s.nonce || s.nonce !== nonce) return fail(ws, "AUTH_PROVE", "nonce mismatch");
      const message = Buffer.from(`Keymaker auth:${nonce}`);
      const sig = bs58.decode(signature);
      const pk = bs58.decode(pubkey);
      const ok = nacl.sign.detached.verify(message, sig, pk);
      if (!ok) return fail(ws, "AUTH_PROVE", "signature verify failed");
      s.authenticated = true;
      s.masterPubkey = pubkey;
      send(ws, { kind: "AUTH_OK", masterPubkey: pubkey });
      return;
    }
    case "FOLDER_CREATE": {
      if (!s.authenticated) return fail(ws, "FOLDER_CREATE", "AUTH_REQUIRED");
      await createFolderWithId(msg.payload.id, msg.payload.name);
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
    case "WALLET_CREATE": {
      if (!s.authenticated) return fail(ws, "WALLET_CREATE", "AUTH_REQUIRED");
      await createWalletInFolder(msg.payload.folderId);
      ack(ws, "WALLET_CREATE");
      const wsInFolder = await listFolderWallets(msg.payload.folderId);
      send(ws, { kind: "WALLETS", folderId: msg.payload.folderId, wallets: wsInFolder });
      return;
    }
    case "WALLET_IMPORT": {
      if (!s.authenticated) return fail(ws, "WALLET_IMPORT", "AUTH_REQUIRED");
      await importWalletToFolder(msg.payload.folderId, msg.payload.secretBase58);
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
    case "TASK_CREATE": {
      if (!s.authenticated) return fail(ws, "TASK_CREATE", "AUTH_REQUIRED");
      const id = await handleTaskCreate({ payload: msg.payload });
      send(ws, { kind: "TASK_ACCEPTED", id });
      return;
    }
  }
}

server.listen(PORT, () => console.log(`[daemon] ws on ${PORT}`));


