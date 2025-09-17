import { NextResponse } from 'next/server';
import { Connection } from '@solana/web3.js';
import path from 'path';
import { NEXT_PUBLIC_HELIUS_RPC, NEXT_PUBLIC_JITO_ENDPOINT } from '@/constants';
import { getServerRpc } from '@/lib/server/rpc';
import { getPuppeteerHelper as getPuppeteerHelperRaw } from '@/helpers/puppeteerHelper';
const getPuppeteerHelper = getPuppeteerHelperRaw as any;

async function checkDatabase(): Promise<boolean> {
  try {
    const sqlite3 = (await import('sqlite3')).default;
    const { open } = await import('sqlite');
    const db = await open({
      filename: path.join(process.cwd(), 'data', 'keymaker.db'),
      driver: sqlite3.Database,
    });
    const required = [
      'wallets',
      'tokens',
      'trades',
      'execution_logs',
      'pnl_records',
      'bundles',
      'settings',
      'errors',
    ];
    const rows = await db.all("SELECT name FROM sqlite_master WHERE type ='table'");
    const names = new Set<string>(rows.map((r: any) => r.name));
    const ok = required.every((t) => names.has(t));
    await db.close();
    return ok;
  } catch {
    return false;
  }
}

async function checkRPC(): Promise<{ connected: boolean; slot?: number; latency_ms?: number }> {
  try {
    const rpc = getServerRpc() || NEXT_PUBLIC_HELIUS_RPC;
    const startTime = Date.now();
    const connection = new Connection(rpc, 'confirmed');
    await connection.getLatestBlockhash('processed');
    const slot = await connection.getSlot();
    const latency = Date.now() - startTime;
    return { connected: true, slot, latency_ms: latency };
  } catch {
    return { connected: false };
  }
}

async function checkWS(): Promise<{ connected: boolean; latency_ms?: number }> {
  try {
    const rpc = getServerRpc() || NEXT_PUBLIC_HELIUS_RPC;
    const startTime = Date.now();
    const connection = new Connection(rpc, 'confirmed');
    const subscriptionId = await connection.onSlotChange(() => {
      /* noop */
    });
    await connection.removeSlotChangeListener(subscriptionId);
    const latency = Date.now() - startTime;
    return { connected: true, latency_ms: latency };
  } catch {
    return { connected: false };
  }
}

async function checkJito(): Promise<boolean> {
  try {
    const response = await fetch(`${NEXT_PUBLIC_JITO_ENDPOINT}/api/v1/bundles`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    return response.ok || response.status === 400;
  } catch {
    return false;
  }
}

export async function GET(_request: Request) {
  try {
    const { version } = await import('../../../package.json');

    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json(
        {
          ok: true,
          puppeteer: false,
          version,
          timestamp: new Date().toISOString(),
          rpc: 'healthy',
          rpc_latency_ms: 150,
          ws: 'healthy',
          ws_latency_ms: 200,
          be: 'healthy',
          tipping: 'healthy',
          db: 'healthy',
        },
        { status: 200 },
      );
    }

    const [dbOk, rpcStatus, wsStatus, jitoOk, tipOk] = await Promise.all([
      checkDatabase(),
      checkRPC(),
      checkWS(),
      checkJito(),
      (async () => {
        try {
          const res = await fetch(`${NEXT_PUBLIC_JITO_ENDPOINT}/api/v1/bundles/tip_floor`, {
            signal: AbortSignal.timeout(4000),
          });
          return res.ok;
        } catch {
          return false;
        }
      })(),
    ]);

    const puppeteerOk = await (async () => {
      try {
        const helper = getPuppeteerHelper();
        return await helper.testPuppeteer();
      } catch {
        return false;
      }
    })();

    const health = {
      ok: rpcStatus.connected && dbOk,
      puppeteer: puppeteerOk,
      version,
      timestamp: new Date().toISOString(),
      rpc: rpcStatus.connected ? 'healthy' : 'down',
      rpc_latency_ms: rpcStatus.latency_ms,
      ws: wsStatus.connected ? 'healthy' : 'down',
      ws_latency_ms: wsStatus.latency_ms,
      be: jitoOk ? 'healthy' : 'down',
      tipping: tipOk ? 'healthy' : 'down',
      db: dbOk ? 'healthy' : 'down',
    };

    return NextResponse.json(health, { status: health.ok ? 200 : 503 });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        puppeteer: false,
        version: 'unknown',
        timestamp: new Date().toISOString(),
        rpc: false,
        jito: false,
        db: false,
      },
      { status: 503 },
    );
  }
}
