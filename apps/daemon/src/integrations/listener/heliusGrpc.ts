import { EventEmitter } from "events";

export type PumpfunEvent = { mint: string; ca: string; slot: number; sig: string };

const emitter = new EventEmitter();

export function onPumpfunEvent(cb: (e: PumpfunEvent) => void) {
  emitter.on("evt", cb);
  return () => emitter.off("evt", cb);
}

export async function startPumpfunListener(): Promise<void> {
  // TODO: wire helius gRPC stream and emit events
  return;
}


