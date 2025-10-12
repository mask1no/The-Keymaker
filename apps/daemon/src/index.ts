import "dotenv/config";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { ensureDb } from "./db";
import { initSolana } from "./solana";
import { checkHealth } from "./health";
import { handleTaskCreate } from "./task-runner";

const PORT = 8787;
const server = createServer();
const wss = new WebSocketServer({ server });

ensureDb();
initSolana();
setInterval(async () => {
  const h = await checkHealth();
  const payload = JSON.stringify({ kind: "HEALTH", ...h });
  wss.clients.forEach((c: any) => c.readyState === 1 && c.send(payload));
}, 5000);

type PendingAuth = { pubkey: string; nonce: Uint8Array };
const authPending = new WeakMap<any, PendingAuth>();
const authed = new WeakSet<any>();

wss.on("connection", (ws) => {
  ws.on("message", async (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.kind === "TASK_CREATE") {
        if (!authed.has(ws)) throw new Error("not authenticated");
        const id = await handleTaskCreate(msg);
        ws.send(JSON.stringify({ kind: "TASK_ACCEPTED", id }));
      } else if (msg.kind === "AUTH_START" && msg.pubkey) {
        const nonce = nacl.randomBytes(24);
        authPending.set(ws, { pubkey: msg.pubkey, nonce });
        ws.send(JSON.stringify({ kind: "AUTH_CHALLENGE", nonce: bs58.encode(nonce) }));
      } else if (msg.kind === "AUTH_RESP" && msg.pubkey && msg.signature && msg.nonce) {
        const pending = authPending.get(ws);
        if (!pending || pending.pubkey !== msg.pubkey) throw new Error("no auth pending for pubkey");
        const expectedNonceB58 = bs58.encode(pending.nonce);
        if (expectedNonceB58 !== msg.nonce) throw new Error("nonce mismatch");
        const message = Buffer.from(`Keymaker auth:${msg.nonce}`);
        const sig = bs58.decode(msg.signature);
        const pk = bs58.decode(msg.pubkey);
        const ok = nacl.sign.detached.verify(message, sig, pk);
        if (!ok) throw new Error("signature verify failed");
        authPending.delete(ws);
        authed.add(ws);
        ws.send(JSON.stringify({ kind: "AUTH_OK", masterWallet: msg.pubkey, signedNonce: msg.signature }));
      } else if (msg.kind === "PUMPFUN_CREATE") {
        if (!authed.has(ws)) throw new Error("not authenticated");
        ws.send(JSON.stringify({ kind: "ERROR", error: "pump.fun client not implemented yet" }));
      }
    } catch (e) {
      ws.send(JSON.stringify({ kind: "ERROR", error: (e as Error).message }));
    }
  });
});

server.listen(PORT, () => console.log(`[daemon] ws on ${PORT}`));


