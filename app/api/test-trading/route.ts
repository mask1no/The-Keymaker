import { NextResponse } from 'next/server';
import { createEngine } from '@/lib/core/src/engine';

export async function GET() {
  try {
    const engine = createEngine({
      mode: 'RPC',
      rpcEndpoint: process.env.RPC_URL || 'https://api.mainnet-beta.solana.com',
      maxRetries: 3,
      timeout: 30000,
    });

    // Test engine creation
    const balance = await engine.getBalance('11111111111111111111111111111112');
    const price = await engine.getPrice('So11111111111111111111111111111111111111112');

    return NextResponse.json({
      success: true,
      message: 'Trading engine initialized successfully',
      testBalance: balance,
      testPrice: price,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Trading engine test error
    return NextResponse.json(
      {
        success: false,
        message: 'Trading engine test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
