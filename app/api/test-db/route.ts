import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/sqlite';

export async function GET() {
  try {
    const db = getDb();

    // Test basic query
    const result = db.get('SELECT 1 as test') as { test: number };

    if (result?.test === 1) {
      return NextResponse.json({
        success: true,
        message: 'Database connection successful',
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Database query failed',
        },
        { status: 500 },
      );
    }
  } catch (error) {
    // Database test error
    return NextResponse.json(
      {
        success: false,
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
