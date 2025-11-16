"use client";

import { useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";
import { useApp } from "./store";

export function useDaemonWS() {
  const { setWsConnected, setMasterWallet, pushNotif } = useApp();
  const { publicKey, signMessage } = useWallet();
  const ref = useRef<WebSocket | null>(null);
  const backoff = useRef(500);
  const listeners = useRef<Array<(m: any) => void>>([]);

  function send(obj: any) {
    const ws = ref.current;
    if (ws && ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
  }

  function onMessage(fn: (m: any) => void) {
    listeners.current.push(fn);
    return () => {
      listeners.current = listeners.current.filter((f) => f !== fn);
    };
  }

  async function prove(nonce: string) {
    if (!publicKey || !signMessage) return;
    const msg = new TextEncoder().encode(`Keymaker auth:${nonce}`);
    const sig = await signMessage(msg);
    send({ kind: "AUTH_PROVE", payload: { pubkey: publicKey.toBase58(), signature: bs58.encode(sig), nonce } });
  }

  useEffect(() => {
    let closed = false;
    function connect() {
      if (closed) return;
      const url = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8787";
      const ws = new WebSocket(url);
      (window as any).__daemon_ws__ = ws;
      ref.current = ws;
      ws.onopen = () => {
        setWsConnected(true);
        backoff.current = 500;
        send({ kind: "AUTH_CHALLENGE" });
      };
      ws.onclose = () => {
        setWsConnected(false);
        ref.current = null;
        setTimeout(connect, backoff.current);
        backoff.current = Math.min(backoff.current * 2, 5000);
      };
      ws.onmessage = (ev) => {
        try {
          const m = JSON.parse(ev.data);
          if (m.kind === "AUTH_NONCE") return prove(String(m.nonce));
          if (m.kind === "AUTH_OK") {
            setMasterWallet(m.masterPubkey);
            pushNotif({ id: crypto.randomUUID(), ts: Date.now(), kind: "health", title: "Connected", severity: "success" });
            return;
          }
          if (m.kind === "ERR") {
            pushNotif({ id: crypto.randomUUID(), ts: Date.now(), kind: "error", title: "Error", body: String(m.error), severity: "error" });
            return;
          }
          if (m.kind?.startsWith("TASK_") || m.kind === "FILL" || m.kind === "HEALTH") {
            pushNotif({ id: crypto.randomUUID(), ts: Date.now(), kind: "task", title: m.kind, body: JSON.stringify(m).slice(0, 160), severity: "info" });
          }
          listeners.current.forEach((fn) => { try { fn(m); } catch {} });
        } catch {}
      };
    }
    connect();
    return () => { closed = true; ref.current?.close(); };
  }, [publicKey, signMessage, setWsConnected, setMasterWallet, pushNotif]);

  return { send, onMessage };
}
