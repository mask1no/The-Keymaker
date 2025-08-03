import { NextResponse } from 'next/server';
import { Connection } from '@solana/web3.js';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

export const dynamic = 'force-dynamic';

async function checkRPC(url: string): Promise<boolean> {
  try {
    const connection = new Connection(url);
    await connection.getLatestBlockhash();
    return true;
  } catch {
    return false;
  }
}

async function checkWebSocket(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(url);
      const timeout = setTimeout(() => {
        ws.close();
        resolve(false);
      }, 5000);

      ws.onopen = () => {
        clearTimeout(timeout);
        ws.close();
        resolve(true);
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };
    } catch {
      resolve(false);
    }
  });
}

async function checkJito(): Promise<boolean> {
  try {
    const response = await fetch('https://mainnet.block-engine.jito.wtf/api/v1/bundles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getBundleStatuses', params: [[]] })
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function checkDatabase(): Promise<boolean> {
  try {
    const dbPath = path.join(process.cwd(), 'data', 'keymaker.db');
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // Check if required tables exist
    const tables = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table'"
    );
    
    const tableNames = tables.map(t => t.name);
    const requiredTables = ['wallets', 'tokens', 'trades', 'errors', 'settings', 'execution_logs', 'pnl_records'];
    const allTablesExist = requiredTables.every(table => tableNames.includes(table));
    
    await db.close();
    return allTablesExist;
  } catch {
    return false;
  }
}

async function checkWallets(): Promise<boolean> {
  try {
    const dbPath = path.join(process.cwd(), 'data', 'keymaker.db');
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    const walletCount = await db.get('SELECT COUNT(*) as count FROM wallets');
    await db.close();
    
    return walletCount?.count > 0;
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    // Get RPC and WS URLs from environment or defaults
    const rpcUrl = process.env.NEXT_PUBLIC_HELIUS_RPC || 'https://api.mainnet-beta.solana.com';
    const wsUrl = rpcUrl.replace('https', 'wss');

    // Run all checks in parallel
    const [rpcOk, wsOk, jitoOk, dbOk, walletsOk] = await Promise.all([
      checkRPC(rpcUrl),
      checkWebSocket(wsUrl),
      checkJito(),
      checkDatabase(),
      checkWallets()
    ]);

    const allOk = rpcOk && wsOk && jitoOk && dbOk && walletsOk;

    const status = {
      ok: allOk,
      checks: {
        rpc: rpcOk,
        websocket: wsOk,
        jito: jitoOk,
        database: dbOk,
        wallets: walletsOk
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(status, { 
      status: allOk ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      }, 
      { status: 503 }
    );
  }
}