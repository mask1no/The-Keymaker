import { NextResponse } from 'next/server';
import { listTrades } from '@/lib/db/sqlite';
import { getSession } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = getSession();
    const user = session?.userPubkey || '';
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit') || '200');
    const offset = Number(searchParams.get('offset') || '0');
    const trades = listTrades({ limit, offset });
    return NextResponse.json({ trades });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error)?.message || 'failed' }, { status: 500 });
  }
}

import path from 'path';
import { z } from 'zod';

export async function POST(request: Request) {
  try {
    const schema = z.object({
      token_address: z.string().min(32),
      tx_ids: z.array(z.string().min(44)).min(1),
      wallets: z.array(z.string().min(32)).min(1),
      sol_in: z.number().finite().nonnegative(),
      sol_out: z.number().finite().nonnegative(),
      pnl: z.number().finite(),
      fees: z.number().finite().nonnegative().optional().default(0),
      gas_fee: z.number().finite().nonnegative().optional().default(0),
      jito_tip: z.number().finite().nonnegative().optional().default(0),
    });
    const bodyText = await request.text();
    const body = schema.parse(bodyText ? JSON.parse(bodyText) : {});
    const {
      token_address,
      tx_ids,
      wallets,
      sol_in,
      sol_out,
      pnl,
      fees = 0,
      gas_fee = 0,
      jito_tip = 0,
    } = body;
    const dbPath = path.join(process.cwd(), 'data', 'keymaker.db');
    const sqlite3 = (await import('sqlite3')).default;
    const { open } = await import('sqlite');
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    const result = await db.run(
      `INSERT INTO trades (token_address, tx_ids, wallets, sol_in, sol_out, pnl, fees, gas_fee, jito_tip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        token_address,
        JSON.stringify(tx_ids),
        JSON.stringify(wallets),
        sol_in,
        sol_out,
        pnl,
        Number(fees) || 0,
        Number(gas_fee) || 0,
        Number(jito_tip) || 0,
      ],
    );
    await db.close();
    return NextResponse.json({ success: true, tradeId: (result as any).lastID });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save trade to database' }, { status: 500 });
  }
}
