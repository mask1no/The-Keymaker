import { NextResponse } from 'next/server';
import { Connection } from '@solana/web3.js';
import path from 'path';
import { promises as fs } from 'fs';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ ok: true }, { status: 200 });
} 