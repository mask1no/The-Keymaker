import 'server-only';
import { Connection, Commitment } from '@solana/web3.js';
import type { HealthStatus, HealthLight } from '@/lib/types/health';
import { getUiSettings } from '@/lib/server/settings';

type HeartbeatState = {
  started: boolean;
  lastHeartbeatAt?: number;
  subscriptionId?: number;
  connection?: Connection;
  wsUrl?: string;
  missed: number;
};
const hb: HeartbeatState = { started: false, missed: 0 };

function lightFromLatency(ms: number | undefined, healthy: number, degraded: number): HealthLight {
  if (ms == null) return 'red';
  if (ms <= healthy) return 'green';
  if (ms <= degraded) return 'amber';
  return 'red';
}

function getRpcUrls(): { rpcUrl: string; wsUrl?: string } {
  const ui = getUiSettings();
  const rpcUrl = ui.rpcHttp || process.env.HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com';
  const wsUrl = ui.wsUrl || process.env.HELIUS_WS_URL || undefined;
  return { rpcUrl, wsUrl };
}

function createConnection(commitment: Commitment = 'processed'): Connection {
  const { rpcUrl } = getRpcUrls();
  return new Connection(rpcUrl, { commitment });
}

async function pingRpc(conn: Connection): Promise<{ latencyMs?: number; slot?: number }> {
  const t0 = Date.now();
  try {
    const slot = await conn.getSlot('processed');
    return { latencyMs: Date.now() - t0, slot };
  } catch {
    return { latencyMs: undefined, slot: undefined };
  }
}

async function getChainHead(conn: Connection): Promise<number | undefined> {
  try {
    return await conn.getSlot('finalized');
  } catch {
    return undefined;
  }
}

async function getJitoTipFloor(): Promise<number | undefined> {
  try {
    const url =
      process.env.JITO_TIP_API || 'https://mainnet.block-engine.jito.wtf/api/v1/tip_floor';
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return undefined;
    const j = (await res.json().catch(() => null)) as any;
    return typeof j?.value === 'number'
      ? j.value
      : typeof j?.tip_floor === 'number'
        ? j.tip_floor
        : undefined;
  } catch {
    return undefined;
  }
}

function ensureHeartbeat() {
  if (hb.started) return;
  const { wsUrl } = getRpcUrls();
  if (!wsUrl) {
    hb.started = true;
    return;
  }
  const conn = new Connection(getRpcUrls().rpcUrl, { wsEndpoint: wsUrl, commitment: 'processed' });
  hb.connection = conn;
  hb.wsUrl = wsUrl;
  hb.started = true;
  hb.missed = 0;
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
  const rpcLight = lightFromLatency(latencyMs, 250, 800);
  const smDelta = head != null && slot != null ? Math.max(0, head - slot) : undefined;
  const smLight: HealthLight =
    head == null
      ? 'red'
      : smDelta != null && smDelta <= 3
        ? 'green'
        : smDelta != null && smDelta <= 10
          ? 'amber'
          : 'red';
  const wsLight: HealthLight = hb.lastHeartbeatAt
    ? now - hb.lastHeartbeatAt < 8_000
      ? 'green'
      : now - hb.lastHeartbeatAt < 30_000
        ? 'amber'
        : 'red'
    : 'amber';

  return {
    jito: {
      light: tip != null ? 'green' : 'amber',
      latencyMs: undefined,
      tipFloor: tip,
      lastAt: now,
      message: tip == null ? 'no tip floor' : undefined,
    },
    rpc: {
      light: rpcLight,
      latencyMs,
      lastAt: now,
      endpoint: getRpcUrls().rpcUrl,
      message: latencyMs == null ? 'rpc error' : undefined,
    },
    ws: {
      light: wsLight,
      lastHeartbeatAt: hb.lastHeartbeatAt,
      missed: hb.missed,
      message: hb.wsUrl ? undefined : 'no ws url',
    },
    sm: {
      light: smLight,
      slot,
      slotDelta: smDelta,
      lastAt: now,
      message: head == null ? 'head unknown' : undefined,
    },
  };
}
