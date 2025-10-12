"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useApp } from "../../../lib/store";
import bs58 from "bs58";

export default function Wallets() {
  const { publicKey, signMessage } = useWallet();
  const { masterWallet, setMasterWallet } = useApp();

  async function setMaster() {
    if (!publicKey) return;
    const ws: WebSocket | undefined = (window as any).__daemon_ws__;
    if (!ws) return;
    const pk = publicKey.toBase58();
    // Start auth challenge
    ws.send(JSON.stringify({ kind: "AUTH_START", pubkey: pk }));
    const challenge = await new Promise<{ nonce: string }>((resolve, reject) => {
      const onMsg = (ev: MessageEvent) => {
        try {
          const m = JSON.parse(ev.data);
          if (m.kind === "AUTH_CHALLENGE") { ws.removeEventListener("message", onMsg); resolve({ nonce: m.nonce }); }
          else if (m.kind === "ERROR") { ws.removeEventListener("message", onMsg); reject(new Error(m.error)); }
        } catch {}
      };
      ws.addEventListener("message", onMsg);
      setTimeout(() => { ws.removeEventListener("message", onMsg); reject(new Error("auth timeout")); }, 10000);
    });
    const msgBytes = new TextEncoder().encode(`Keymaker auth:${challenge.nonce}`);
    // signMessage may be undefined on some wallets; skip if unavailable
    const direct = (await (window as any).solana?.signMessage?.(msgBytes, "utf8"))?.signature;
    const sigBuf = direct || (await signMessage?.(msgBytes));
    if (!sigBuf) return;
    const sigB58 = bs58.encode(sigBuf);
    ws.send(JSON.stringify({ kind: "AUTH_RESP", pubkey: pk, nonce: challenge.nonce, signature: sigB58 }));
    // Wait for OK
    await new Promise<void>((resolve, reject) => {
      const onMsg = (ev: MessageEvent) => {
        try {
          const m = JSON.parse(ev.data);
          if (m.kind === "AUTH_OK") { ws.removeEventListener("message", onMsg); resolve(); }
          else if (m.kind === "ERROR") { ws.removeEventListener("message", onMsg); reject(new Error(m.error)); }
        } catch {}
      };
      ws.addEventListener("message", onMsg);
      setTimeout(() => { ws.removeEventListener("message", onMsg); reject(new Error("auth timeout")); }, 10000);
    });
    setMasterWallet(pk);
  }

  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      <div style={{ padding: 16, borderRadius: 16, background: "#18181b", border: "1px solid #27272a" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Master Wallet</h2>
            <p style={{ fontSize: 12, color: "#a1a1aa" }}>Connected wallet funds folder wallets.</p>
          </div>
          <WalletMultiButton />
        </div>
        <div style={{ marginTop: 16 }}>
          <button
            style={{ padding: "8px 16px", borderRadius: 12, background: "#059669" }}
            disabled={!publicKey}
            onClick={() => { setMaster().catch(console.error); }}
          >
            Set as Master
          </button>
          <p style={{ marginTop: 8, fontSize: 12 }}>Current: {masterWallet ?? "None"}</p>
        </div>
      </div>
      {/* TODO: Folder manager UI (create/import wallets, up to 20 per folder) */}
    </div>
  );
}


