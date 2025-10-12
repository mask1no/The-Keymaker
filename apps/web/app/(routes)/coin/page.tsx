"use client";
import { useDaemonWS } from "../../../lib/ws";

export default function CoinCreate() {
  const { send } = useDaemonWS();
  function onCreate() {
    // demo trigger – daemon will throw typed not-implemented
    send({ kind: "PUMPFUN_CREATE", payload: { name: "Demo", symbol: "DEMO", decimals: 9, metadataUri: "ipfs://todo" } });
  }
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600 }}>Create Coin (pump.fun)</h2>
      <button style={{ marginTop: 12, padding: "8px 16px", borderRadius: 12, background: "#059669" }} onClick={onCreate}>
        Create (stub)
      </button>
    </div>
  );
}


