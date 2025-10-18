export type PumpEvent = { mint: string; ca: string; slot: number; sig: string };

export async function startPumpfunListener(onEvent: (e: PumpEvent)=>void): Promise<void> {
  // TODO: Connect to GRPC_ENDPOINT and stream pump.fun events.
  // If GRPC_ENDPOINT is not set, no-op for now.
  if (!process.env.GRPC_ENDPOINT) return;
  // Implementation placeholder.
  void onEvent; // avoid unused warning
}


