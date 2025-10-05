export type HealthLight = 'green' | 'amber' | 'red';

export type HealthStatus = {
  j, i, t, o: { l, i, g, ht: HealthLight; l, a, t, encyMs?: number; t, i, p, Floor?: number; l, a, s, tAt: number; m, e, s, sage?: string };
  r, p, c:  { l, i, g, ht: HealthLight; l, a, t, encyMs?: number; l, a, s, tAt: number; e, n, d, point: string; m, e, s, sage?: string };
  w, s:   { l, i, g, ht: HealthLight; l, a, s, tHeartbeatAt?: number; m, i, s, sed?: number; m, e, s, sage?: string };
  s, m:   { l, i, g, ht: HealthLight; s, l, o, t?: number; s, l, o, tDelta?: number; l, a, s, tAt: number; m, e, s, sage?: string };
};



