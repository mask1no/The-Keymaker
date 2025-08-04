import { NextResponse } from 'next/server';
import { Connection } from '@solana/web3.js';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { NEXT_PUBLIC_HELIUS_RPC, NEXT_PUBLIC_JITO_ENDPOINT } from '@/constants';

async function checkDatabase(): Promise<boolean> {
  try {
    const db = await open({
      filename: path.join(process.cwd(), 'data', 'analytics.db'),
      driver: sqlite3.Database
    });
    
    // Check if tables exist
    const tables = await db.all(`
      SELECT name FROM sqlite_master WHERE type='table'
    `);
    
    await db.close();
    return tables.length > 0;
  } catch {
    return false;
  }
}

async function checkRPC(): Promise<{ connected: boolean; slot?: number }> {
  try {
    const connection = new Connection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed');
    const slot = await connection.getSlot();
    return { connected: true, slot };
  } catch {
    return { connected: false };
  }
}

async function checkJito(): Promise<boolean> {
  try {
    const response = await fetch(`${NEXT_PUBLIC_JITO_ENDPOINT}/api/v1/bundles`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000)
    });
    
    // 400 is expected without auth, but it means the endpoint is reachable
    return response.ok || response.status === 400;
  } catch {
    return false;
  }
}

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Run health checks in parallel
    const [dbOk, rpcStatus, jitoOk] = await Promise.all([
      checkDatabase(),
      checkRPC(),
      checkJito()
    ]);
    
    const responseTime = Date.now() - startTime;
    
    // Check if Puppeteer is installed (check for chromium executable)
    const puppeteerInstalled = (() => {
      try {
        const fs = require('fs');
        // Check common chromium paths
        const chromiumPaths = [
          '/usr/bin/chromium-browser',
          '/usr/bin/chromium',
          process.env.PUPPETEER_EXECUTABLE_PATH || ''
        ];
        return chromiumPaths.some(path => path && fs.existsSync(path));
      } catch {
        return false;
      }
    })();
    
    const health = {
      ok: dbOk && rpcStatus.connected,
      version: '1.1.2',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      checks: {
        database: dbOk ? 'healthy' : 'unhealthy',
        rpc: rpcStatus.connected ? 'healthy' : 'unhealthy',
        jito: jitoOk ? 'healthy' : 'unhealthy',
        slot: rpcStatus.slot,
        PUPPETEER_INSTALLED: puppeteerInstalled
      }
    };
    
    return NextResponse.json(health, {
      status: health.ok ? 200 : 503
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      version: '1.1.2',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    }, { status: 503 });
  }
}