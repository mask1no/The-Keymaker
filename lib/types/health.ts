export type HealthLight = 'green' | 'amber' | 'red';

export type HealthStatus = {
  jito: { light: HealthLight; latencyMs?: number; tipFloor?: number; lastAt: number; message?: string };
  rpc:  { light: HealthLight; latencyMs?: number; lastAt: number; endpoint: string; message?: string };
  ws:   { light: HealthLight; lastHeartbeatAt?: number; missed?: number; message?: string };
  sm:   { light: HealthLight; slot?: number; slotDelta?: number; lastAt: number; message?: string };
};


