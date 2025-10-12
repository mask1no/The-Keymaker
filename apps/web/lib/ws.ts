"use client";
import { useEffect, useMemo, useRef } from "react";
import { useApp } from "./store";
import bs58 from "bs58";
import { useWallet } from "@solana/wallet-adapter-react";

export function useDaemonWS() {
  const { setWsConnected, setMasterWallet } = useApp();
  const { publicKey, signMessage } = useWallet();
  const ref = useRef<WebSocket | null>(null);
  const listeners = useRef<((msg: any)=>void)[]>([]);
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8787";
    const ws = new WebSocket(url);
    ref.current = ws;
    (window as any).__daemon_ws__ = ws;
    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);
    ws.onerror = () => setWsConnected(false);
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        console.log("[daemon-ws]", msg);
        if (msg.kind === "AUTH_NONCE") { void proveAuth(msg.nonce); }
        if (msg.kind === "AUTH_OK") { setMasterWallet(msg.masterPubkey); }
        listeners.current.forEach((fn)=>{ try { fn(msg); } catch {} });
      } catch {}
    };
    // request nonce on connect
    ws.addEventListener("open", () => { ws.send(JSON.stringify({ kind: "AUTH_CHALLENGE" })); });
    return () => ws.close();
  }, [setWsConnected, setMasterWallet]);
  function send(msg: unknown) { ref.current?.send(JSON.stringify(msg)); }
  function onMessage(fn: (msg: any)=>void) { listeners.current.push(fn); return () => { listeners.current = listeners.current.filter(f=>f!==fn); }; }
  async function proveAuth(nonce: string) {
    try {
      if (!publicKey) return;
      const msgBytes = new TextEncoder().encode(`Keymaker auth:${nonce}`);
      const sigBuf = await signMessage?.(msgBytes);
      if (!sigBuf) return;
      const signature = bs58.encode(sigBuf);
      send({ kind: "AUTH_PROVE", payload: { pubkey: publicKey.toBase58(), signature, nonce } });
    } catch (e) { console.warn("auth prove failed", e); }
  }
  return { send, onMessage };
}


