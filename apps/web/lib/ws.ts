"use client";
import { useEffect, useMemo, useRef } from "react";
import { useApp } from "./store";
import bs58 from "bs58";
import { useWallet } from "@solana/wallet-adapter-react";

export function useDaemonWS() {
  const { setWsConnected, setMasterWallet, pushNotif } = useApp();
  const lastHealth = useRef<{ rpcOk?: boolean; jitoOk?: boolean }>({});
  const { publicKey, signMessage } = useWallet();
  const ref = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<any>(null);
  const backoffRef = useRef<number>(500);
  const sendQueue = useRef<any[]>([]);
  const listeners = useRef<((msg: any)=>void)[]>([]);
  const dedup = useRef<Map<string, number>>(new Map());
  function shouldNotify(key: string, ttlMs = 5000) {
    const now = Date.now();
    const prev = dedup.current.get(key) || 0;
    if (now - prev < ttlMs) return false;
    dedup.current.set(key, now);
    // Garbage collect
    if (dedup.current.size > 500) {
      const entries = [...dedup.current.entries()].sort((a,b)=>a[1]-b[1]).slice(-400);
      dedup.current = new Map(entries);
    }
    return true;
  }
  useEffect(() => {
    function connect() {
      const url = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8787";
      try {
        const ws = new WebSocket(url);
        ref.current = ws;
        if (process.env.NODE_ENV !== "production") {
          (window as any).__daemon_ws__ = ws;
        }
        ws.onopen = () => {
          setWsConnected(true);
          // flush queued messages
          const pending = [...sendQueue.current];
          sendQueue.current = [];
          for (const m of pending) {
            try { ws.send(JSON.stringify(m)); } catch {}
          }
          // reset backoff
          backoffRef.current = 500;
          // request auth challenge
          try { ws.send(JSON.stringify({ kind: "AUTH_CHALLENGE" })); } catch {}
        };
        ws.onclose = () => {
          setWsConnected(false);
          scheduleReconnect();
        };
        ws.onerror = () => {
          setWsConnected(false);
          scheduleReconnect();
        };
        ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        console.log("[daemon-ws]", msg);
        if (msg.kind === "AUTH_NONCE") { void proveAuth(msg.nonce); }
        if (msg.kind === "AUTH_OK") { setMasterWallet(msg.masterPubkey); }
        if (msg.kind === "ERR" && msg.error === "AUTH_REQUIRED") { console.warn("auth required"); }
        // Notifications mapping
        if (msg.kind === "FUND_RESULT") {
          const key = `FUND_RESULT:${msg.folderId}:${msg.signatures?.length||0}`;
          if (shouldNotify(key)) pushNotif({ id: crypto.randomUUID(), ts: Date.now(), kind: "task", title: `Funded folder`, body: `${msg.signatures.length} txs`, severity: "success" });
        }
        if (msg.kind === "SWEEP_DONE") {
          const key = `SWEEP_DONE:${msg.id}:${msg.signatures?.length||0}`;
          if (shouldNotify(key)) pushNotif({ id: crypto.randomUUID(), ts: Date.now(), kind: "task", title: `Sweep complete`, body: `${msg.signatures.length} sigs`, severity: "success" });
        }
        if (msg.kind === "COIN_CREATED") {
          const key = `COIN_CREATED:${msg.mint}:${msg.sig}`;
          if (shouldNotify(key, 10000)) pushNotif({ id: crypto.randomUUID(), ts: Date.now(), kind: "coin", title: `SPL created`, body: msg.mint, severity: "success", ca: msg.mint, sig: msg.sig });
        }
        if (msg.kind === "COIN_PUBLISHED") {
          const key = `COIN_PUBLISHED:${msg.mint}:${msg.sig}`;
          if (shouldNotify(key, 10000)) pushNotif({ id: crypto.randomUUID(), ts: Date.now(), kind: "coin", title: `Pump.fun published`, body: msg.mint, severity: "success", ca: msg.mint, sig: msg.sig });
        }
        if (msg.kind === "TASK_EVENT") {
          const final = msg.state === "DONE" || msg.state === "FAIL" || msg.state === "ABORT";
          const key = `TASK_EVENT:${msg.id}:${msg.state}`;
          if (shouldNotify(key)) pushNotif({ id: crypto.randomUUID(), ts: Date.now(), kind: "task", title: `Task ${msg.state}`, severity: final ? (msg.state === "DONE" ? "success" : "error") : "info" });
        }
        if (msg.kind === "TASK_EVENT" && msg.state === "FILL" && msg.info?.sig) {
          const side = (msg.info.side || "BUY").toUpperCase();
          if (shouldNotify(`FILL:${msg.info.sig}`, 10000)) pushNotif({
            id: crypto.randomUUID(), ts: Date.now(), kind: "trade",
            title: `${side} fill`, body: `${(msg.info.qty||0)} @ ${(msg.info.price||0)}`,
            ca: msg.info.ca, sig: msg.info.sig, severity: "success"
          });
        }
        if (msg.kind === "PUMP_EVENT") {
          const key = `PUMP_EVENT:${msg.ca}:${msg.sig}`;
          if (shouldNotify(key, 10000)) pushNotif({ id: crypto.randomUUID(), ts: Date.now(), kind: "trade", title: "Pump.fun event", body: msg.mint, ca: msg.ca, severity: "info", sig: msg.sig });
        }
        if (msg.kind === "ERR") {
          const key = `ERR:${msg.ref||""}:${msg.error}`;
          if (shouldNotify(key)) pushNotif({ id: crypto.randomUUID(), ts: Date.now(), kind: "error", title: `Error: ${msg.error}`, severity: "error" });
        }
        if (msg.kind === "HEALTH") {
          const prev = lastHealth.current;
          if (prev.rpcOk !== undefined && prev.rpcOk !== msg.rpcOk) {
            pushNotif({ id: crypto.randomUUID(), ts: Date.now(), kind: "health", title: msg.rpcOk ? "RPC recovered" : "RPC degraded", severity: msg.rpcOk ? "success" : "warn" });
          }
          if (prev.jitoOk !== undefined && prev.jitoOk !== msg.jitoOk) {
            pushNotif({ id: crypto.randomUUID(), ts: Date.now(), kind: "health", title: msg.jitoOk ? "Jito recovered" : "Jito degraded", severity: msg.jitoOk ? "success" : "warn" });
          }
          lastHealth.current = { rpcOk: msg.rpcOk, jitoOk: msg.jitoOk };
        }
        listeners.current.forEach((fn)=>{ try { fn(msg); } catch {} });
      } catch {}
        };
      } catch {
        scheduleReconnect();
      }
    }
    function scheduleReconnect() {
      if (reconnectTimer.current) return;
      const delay = Math.min(5000, backoffRef.current);
      reconnectTimer.current = setTimeout(() => {
        reconnectTimer.current = null;
        backoffRef.current = Math.min(5000, Math.floor(backoffRef.current * 1.5) + 100);
        connect();
      }, delay);
    }
    connect();
    return () => {
      try { ref.current?.close(); } catch {}
      if (reconnectTimer.current) { clearTimeout(reconnectTimer.current); reconnectTimer.current = null; }
    };
  }, [setWsConnected, setMasterWallet]);
  function send(msg: unknown) {
    const ws = ref.current;
    const payload = msg as any;
    if (ws && ws.readyState === 1) {
      try { ws.send(JSON.stringify(payload)); } catch {}
    } else {
      // queue for when connected
      sendQueue.current.push(payload);
      // cap queue
      if (sendQueue.current.length > 200) sendQueue.current = sendQueue.current.slice(-200);
    }
  }
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


