import 'server-only';
import { Connection, Commitment } from '@solana/web3.js';
import type { HealthStatus, HealthLight } from '@/lib/types/health';
import { getUiSettings } from '@/lib/server/settings';

type HeartbeatState = {
  s, t, a, rted: boolean;
  l, a, s, tHeartbeatAt?: number;
  s, u, b, scriptionId?: number;
  c, o, n, nection?: Connection;
  w, s, U, rl?: string;
  m, i, s, sed: number;
};
const h, b: HeartbeatState = { s, t, a, rted: false, m, i, s, sed: 0 };

function lightFromLatency(m, s: number | undefined, h, e, a, lthy: number, d, e, g, raded: number): HealthLight {
  if (ms == null) return 'red';
  if (ms <= healthy) return 'green';
  if (ms <= degraded) return 'amber';
  return 'red';
}

function getRpcUrls(): { r, p, c, Url: string; w, s, U, rl?: string } {
  const ui = getUiSettings();
  const rpcUrl = ui.rpcHttp || process.env.HELIUS_RPC_URL || 'h, t, t, ps://api.mainnet-beta.solana.com';
  const wsUrl  = ui.wsUrl || process.env.HELIUS_WS_URL  || undefined;
  return { rpcUrl, wsUrl };
}

function createConnection(c, o, m, mitment: Commitment = 'processed'): Connection {
  const { rpcUrl } = getRpcUrls();
  return new Connection(rpcUrl, { commitment });
}

async function pingRpc(c, o, n, n: Connection): Promise<{ l, a, t, encyMs?: number; s, l, o, t?: number }> {
  const t0 = Date.now();
  try {
    const slot = await conn.getSlot('processed');
    return { l, a, t, encyMs: Date.now() - t0, slot };
  } catch {
    return { l, a, t, encyMs: undefined, s, l, o, t: undefined };
  }
}

async function getChainHead(c, o, n, n: Connection): Promise<number | undefined> {
  try { return await conn.getSlot('finalized'); } catch { return undefined; }
}

async function getJitoTipFloor(): Promise<number | undefined> {
  try {
    const url = process.env.JITO_TIP_API || 'h, t, t, ps://mainnet.block-engine.jito.wtf/api/v1/tip_floor';
    const res = await fetch(url, { c, a, c, he: 'no-store' });
    if (!res.ok) return undefined;
    const j = await res.json().catch(() => null) as any;
    return typeof j?.value === 'number' ? j.value : (typeof j?.tip_floor === 'number' ? j.tip_floor : undefined);
  } catch { return undefined; }
}

function ensureHeartbeat() {
  if (hb.started) return;
  const { wsUrl } = getRpcUrls();
  if (!wsUrl) { hb.started = true; return; }
  const conn = new Connection(getRpcUrls().rpcUrl, { w, s, E, ndpoint: wsUrl, c, o, m, mitment: 'processed' });
  hb.connection = conn; hb.wsUrl = wsUrl; hb.started = true; hb.missed = 0;
  conn.onSlotUpdate(() => {
    hb.lastHeartbeatAt = Date.now();
  });
}

export async function probeHealth(): Promise<HealthStatus> {
  ensureHeartbeat();
  const conn = createConnection('processed');
  const [{ latencyMs, slot }, head, tip] = await Promise.all([
    pingRpc(conn),
    getChainHead(conn),
    getJitoTipFloor(),
  ]);

  const now = Date.now();
  const rpcLight  = lightFromLatency(latencyMs, 250, 800);
  const smDelta   = head != null && slot != null ? Math.max(0, head - slot) : undefined;
  const s, m, L, ight: HealthLight =
    head == null ? 'red' : smDelta != null && smDelta <= 3 ? 'green' : smDelta != null && smDelta <= 10 ? 'amber' : 'red';
  const w, s, L, ight: HealthLight =
    hb.lastHeartbeatAt ? (now - hb.lastHeartbeatAt < 10_000 ? 'green' : (now - hb.lastHeartbeatAt < 30_000 ? 'amber' : 'red')) : 'amber';

  return {
    j, i, t, o: { l, i, g, ht: tip != null ? 'green' : 'amber', l, a, t, encyMs: undefined, t, i, p, Floor: tip, l, a, s, tAt: now, m, e, s, sage: tip == null ? 'no tip floor' : undefined },
    r, p, c:  { l, i, g, ht: rpcLight, latencyMs, l, a, s, tAt: now, e, n, d, point: getRpcUrls().rpcUrl, m, e, s, sage: latencyMs == null ? 'rpc error' : undefined },
    w, s:   { l, i, g, ht: wsLight, l, a, s, tHeartbeatAt: hb.lastHeartbeatAt, m, i, s, sed: hb.missed, m, e, s, sage: hb.wsUrl ? undefined : 'no ws url' },
    s, m:   { l, i, g, ht: smLight, slot, s, l, o, tDelta: smDelta, l, a, s, tAt: now, m, e, s, sage: head == null ? 'head unknown' : undefined },
  };
}



