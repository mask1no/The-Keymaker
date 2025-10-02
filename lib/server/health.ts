import 'server-only';
import { Connection, Commitment } from '@solana/web3.js';
import type { HealthStatus, HealthLight } from '@/lib/types/health';
import { getTipFloor } from '@/lib/core/src/jito';
import { reportRpcHealth } from '@/lib/network';

// Persistent WS heartbeat state (process scoped)
type HeartbeatState = {
  started: boolean;
  lastHeartbeatAt?: number;
  subscriptionId?: number;
  connection?: Connection;
  wsUrl?: string;
};

const hb: HeartbeatState = {
  started: false,
};

const HEARTBEAT_INTERVAL_MS = 1000; // expected slot heartbeat cadence

function lightFromLatency(ms: number | undefined, healthyMs: number, degradedMs: number): HealthLight {
  if (ms === undefined) return 'red';
  if (ms <= healthyMs) return 'green';
  if (ms <= degradedMs) return 'amber';
  return 'red';
}

function getRpcUrls(): { rpcUrl: string; wsUrl?: string } {
  const rpcUrl =
    process.env.HELIUS_RPC_URL || process.env.NEXT_PUBLIC_HELIUS_RPC || 'https://api.mainnet-beta.solana.com';
  const wsUrl = process.env.HELIUS_WS_URL || process.env.NEXT_PUBLIC_HELIUS_WS || undefined;
  return { rpcUrl, wsUrl };
}

function createConnection(commitment: Commitment = 'processed'): Connection {
  const { rpcUrl, wsUrl } = getRpcUrls();
  return new Connection(rpcUrl, {
    commitment,
    wsEndpoint: wsUrl,
    confirmTransactionInitialTimeout: 20_000,
    disableRetryOnRateLimit: true,
  } as any);
}

function ensureWsHeartbeat(): void {
  const { wsUrl } = getRpcUrls();
  // If no ws configured, skip persistent heartbeat
  if (!wsUrl) {
    hb.started = false;
    return;
  }
  if (hb.started && hb.wsUrl === wsUrl && hb.connection) return;
  try {
    const conn = createConnection('processed');
    hb.connection = conn;
    hb.wsUrl = wsUrl;
    hb.started = true;
    // Subscribe to slot changes to treat as heartbeat
    hb.subscriptionId = conn.onSlotChange(() => {
      hb.lastHeartbeatAt = Date.now();
    });
  } catch {
    // leave hb as-is; caller will interpret as missed
  }
}

async function probeRpc(): Promise<{ light: HealthLight; latencyMs?: number; endpoint: string; lastAt: number; message?: string; slot?: number; slotDelta?: number }> {
  const { rpcUrl } = getRpcUrls();
  const endpoint = rpcUrl.split('?')[0];
  let latency: number | undefined;
  let message: string | undefined;
  let slot: number | undefined;
  let slotDelta: number | undefined;
  try {
    const t0 = Date.now();
    const conn = createConnection('processed');
    // getHealth may throw on some providers; ignore error but use latency
    await Promise.race([
      conn.getLatestBlockhash('processed'),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 10_000)),
    ]);
    slot = await conn.getSlot('processed');
    latency = Date.now() - t0;
    try {
      // Some providers expose getHealth; optional and not typed in web3.js
      await (conn as any).getHealth?.();
    } catch {}
  } catch (e: any) {
    message = e?.message || 'RPC unreachable';
  }
  // Thresholds per spec
  const light = lightFromLatency(latency, 400, 1200);
  return { light, latencyMs: latency, endpoint, lastAt: Date.now(), message, slot, slotDelta };
}

function probeWs(): { light: HealthLight; lastHeartbeatAt?: number; missed?: number; message?: string } {
  ensureWsHeartbeat();
  if (!hb.started) {
    return { light: 'red', message: 'WS not configured' };
  }
  const now = Date.now();
  const last = hb.lastHeartbeatAt || 0;
  const missed = last ? Math.max(0, Math.floor((now - last) / HEARTBEAT_INTERVAL_MS) - 1) : Number.POSITIVE_INFINITY;
  // Light calculation: <=3 green, <=6 amber, else red
  const light: HealthLight = !isFinite(missed) ? 'red' : missed > 6 ? 'red' : missed > 3 ? 'amber' : 'green';
  return { light, lastHeartbeatAt: hb.lastHeartbeatAt, missed: isFinite(missed) ? missed : undefined, message: undefined };
}

async function probeJito(): Promise<{ light: HealthLight; latencyMs?: number; tipFloor?: number; lastAt: number; message?: string }> {
  let latency: number | undefined;
  let tip: number | undefined;
  let message: string | undefined;
  try {
    const t0 = Date.now();
    const tf = await getTipFloor('ffm' as any);
    latency = Date.now() - t0;
    tip = (tf as any).ema_landed_tips_50th_percentile ?? (tf as any).landed_tips_50th_percentile;
  } catch (e: any) {
    message = e?.message || 'Jito unreachable';
  }
  const light: HealthLight = lightFromLatency(latency, 1500, 5000);
  return { light, latencyMs: latency, tipFloor: tip, lastAt: Date.now(), message };
}

async function probeSm(rpcSlot?: number): Promise<{ light: HealthLight; slot?: number; slotDelta?: number; message?: string }> {
  try {
    const conn = createConnection('processed');
    const slot = rpcSlot ?? (await conn.getSlot('processed'));
    // Use block height delta as a rough freshness indicator
    const { lastValidBlockHeight } = await conn.getLatestBlockhash('processed');
    const height = await conn.getBlockHeight('processed');
    const slotDelta = Math.max(0, (lastValidBlockHeight ?? 0) - height);
    const light: HealthLight = slotDelta < 50 ? 'green' : 'amber';
    return { light, slot, slotDelta };
  } catch (e: any) {
    return { light: 'red', message: 'No slot info' };
  }
}

export async function probeHealth(): Promise<HealthStatus> {
  const [rpc, jito] = await Promise.all([probeRpc(), probeJito()]);
  const ws = probeWs();
  const sm = await probeSm(rpc.slot);
  try { reportRpcHealth(rpc.light); } catch {}
  return {
    jito: { light: jito.light, latencyMs: jito.latencyMs, tipFloor: jito.tipFloor, lastAt: jito.lastAt, message: jito.message },
    rpc: { light: rpc.light, latencyMs: rpc.latencyMs, endpoint: rpc.endpoint, lastAt: rpc.lastAt, message: rpc.message },
    ws: { light: ws.light, lastHeartbeatAt: ws.lastHeartbeatAt, missed: ws.missed, message: ws.message },
    sm: { light: sm.light, slot: sm.slot, slotDelta: sm.slotDelta, message: sm.message },
  };
}


