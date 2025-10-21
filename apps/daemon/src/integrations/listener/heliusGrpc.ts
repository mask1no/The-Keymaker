export type PumpEvent = { mint: string; ca: string; slot: number; sig: string };

export async function startPumpfunListener(onEvent: (e: PumpEvent)=>void): Promise<void> {
  // If GRPC_ENDPOINT is not set, no-op.
  const endpoint = process.env.GRPC_ENDPOINT;
  if (!endpoint) {
    try { (await import("@keymaker/logger")).logger.info("listener", { op: "disabled" }); } catch {}
    return;
  }
  // Minimal backoff loop with dynamic import to avoid hard dep when unset
  let stop = false;
  const connect = async () => {
    while (!stop) {
      try {
        const mod = await import("@helius-labs/helius-grpc").catch(() => null as any);
        if (!mod) throw new Error("GRPC_CLIENT_NOT_AVAILABLE");
        const { HeliusClient } = mod as any;
        const client = new HeliusClient(endpoint);
        // Subscribe to program logs mentioning pump.fun create events
        const stream = client.subscribeProgramLogs({ programIds: ["5h6UNi88C5Z4HzyBbs6k8ZZrVSu2Ce279b9EcRWWQf4r"] });
        try { (await import("../../state")).setListenerActive(true); } catch {}
        stream.on("data", (msg: any) => {
          try {
            // Parse minimal fields; users can enhance later
            const slot = Number(msg.slot || 0);
            const sig = String(msg.signature || "");
            const mint = String(msg.mint || "");
            const ca = mint; // alias
            if (mint) onEvent({ mint, ca, slot, sig });
          } catch { /* ignore malformed */ }
        });
        await new Promise<void>((resolve, reject) => {
          stream.on("end", () => resolve());
          stream.on("error", () => resolve());
        });
        try { (await import("../../state")).setListenerActive(false); } catch {}
      } catch {
        // Backoff and reconnect
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  };
  void connect();
}


