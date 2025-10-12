"use client";
import { useEffect, useRef } from "react";
import { useApp } from "./store";

export function useDaemonWS() {
  const { setWsConnected } = useApp();
  const ref = useRef<WebSocket | null>(null);
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
        // log all messages for visibility (TASK_ACCEPTED, HEALTH, etc.)
        // secrets are never sent over WS
        console.log("[daemon-ws]", msg);
        if (msg.kind === "HEALTH") {
          // no-op here; Settings page can parse from console or expand store later
        }
      } catch {}
    };
    return () => ws.close();
  }, [setWsConnected]);
  function send(msg: unknown) { ref.current?.send(JSON.stringify(msg)); }
  return { send };
}


