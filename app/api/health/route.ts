import { NextResponse } from 'next/server';
import { Connection } from '@solana/web3.js';
import path from 'path';
import { promises as fs } from 'fs';

export const dynamic = 'force-dynamic';

export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      server: true,
      database: false,
      rpc: false,
    },
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  };

  try {
    // Check database
    const dbPath = path.join(process.cwd(), 'data', 'analytics.db');
    await fs.access(dbPath);
    health.checks.database = true;
  } catch {
    health.checks.database = false;
  }

  // Check RPC connection (with timeout)
  try {
    const rpcUrl = process.env.NEXT_PUBLIC_HELIUS_RPC;
    if (rpcUrl && !rpcUrl.includes('YOUR_API_KEY')) {
      const connection = new Connection(rpcUrl);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 2000)
      );
      
      await Promise.race([
        connection.getSlot(),
        timeoutPromise
      ]);
      
      health.checks.rpc = true;
    }
  } catch {
    health.checks.rpc = false;
  }

  // Determine overall health
  const allHealthy = Object.values(health.checks).every(check => check === true);
  
  if (!allHealthy) {
    health.status = 'degraded';
  }

  return NextResponse.json(health, {
    status: allHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
} 