import { NextResponse } from 'next/server';
import { Connection } from '@solana/web3.js';
import { getSession } from '@/lib/server/session';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Health = 'ok' | 'degraded' | 'down';

async function getRpcUrl(): Promise<{ rpc: string; ws?: string; jitoEnabled: boolean }> {
  // Read unified settings directly from sqlite ui_settings
  const db = await getDb();
  const row = await db
    .get('SELECT value FROM ui_settings WHERE key = ?', ['customFees'])
    .catch(() => null);
  let jitoEnabled = false;
  try {
    const val = row?.value ? JSON.parse(row.value) : null;
    jitoEnabled = !!val?.jito?.enabled;
  } catch {}
  const rpc =
    process.env.HELIUS_RPC_URL ||
    process.env.NEXT_PUBLIC_HELIUS_RPC ||
    'https://api.mainnet-beta.solana.com';
  const ws = process.env.HELIUS_WS_URL || process.env.NEXT_PUBLIC_HELIUS_WS || undefined;
  return { rpc, ws, jitoEnabled };
}

function gradeRtt(ms?: number): Health {
  if (ms == null) return 'down';
  if (ms < 250) return 'ok';
  if (ms < 600) return 'degraded';
  return 'down';
}

function gradeHeartbeat(ageMs?: number): Health {
  if (ageMs == null) return 'down';
  if (ageMs < 8000) return 'ok';
  if (ageMs < 20000) return 'degraded';
  return 'down';
}

let lastHeartbeatAt: number | undefined;
let hbStarted = false;

function ensureHeartbeat(wsUrl: string | undefined, rpcUrl: string) {
  if (hbStarted) return;
  hbStarted = true;
  try {
    const conn = new Connection(
      rpcUrl,
      wsUrl ? { wsEndpoint: wsUrl, commitment: 'processed' } : { commitment: 'processed' },
    );
    if (wsUrl) {
      conn.onSlotUpdate(() => {
        lastHeartbeatAt = Date.now();
      });
    }
  } catch {}
}

export async function GET() {
  try {
    // Optional: health should be public; do not require SIWS strictly for GET /api/health
    const { rpc, ws, jitoEnabled } = await getRpcUrl();
    ensureHeartbeat(ws, rpc);

    const conn = new Connection(rpc, { commitment: 'processed' });
    const t0 = Date.now();
    const [slot, head] = await Promise.all([
      conn.getSlot('processed').catch(() => undefined),
      conn.getSlot('finalized').catch(() => undefined),
    ]);
    const rttMs = Number.isFinite(slot as any) ? Date.now() - t0 : undefined;
    const delta = head != null && slot != null ? Math.max(0, head - slot) : 0;
    const now = Date.now();
    const lastHbMs = lastHeartbeatAt ? now - lastHeartbeatAt : undefined;

    const body = {
      rpc: { rttMs: rttMs ?? 0, health: gradeRtt(rttMs) },
      ws: { lastHeartbeatMs: lastHbMs ?? 0, health: gradeHeartbeat(lastHbMs) },
      slot: { current: slot ?? 0, delta: delta ?? 0 },
      jito: { enabled: jitoEnabled },
    } as const;
    return NextResponse.json(body, {
      status: 200,
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
    });
  } catch (e: unknown) {
    return NextResponse.json(
      {
        rpc: { rttMs: 0, health: 'down' },
        ws: { lastHeartbeatMs: 0, health: 'down' },
        slot: { current: 0, delta: 0 },
        jito: { enabled: false },
        error: (e as Error)?.message || 'failed',
      },
      { status: 500 },
    );
  }
}

/* legacy content removed in favor of new health payload */
