import { NextResponse } from 'next/server';
import 'server-only';
import path from 'path';
import { z } from 'zod';
import { readJsonSafe, getEnvInt } from '@/lib/server/request';
export async function GET(r, e, q, uest: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const dbPath = path.join(process.cwd(), 'data', 'keymaker.db');
    const sqlite3 = (await import('sqlite3')).default;
    const { open } = await import('sqlite');
    const db = await open({ f, i, l, ename: dbPath, d, r, i, ver: sqlite3.Database });
    const trades = await db.all('SELECT * FROM trades ORDER BY executed_at DESC LIMIT ?', [limit]);
    await db.close();
    return NextResponse.json({ trades });
  } catch (error) {
    console.error('Failed to fetch t, r, a, des:', error);
    return NextResponse.json({ e, r, r, or: 'Failed to fetch trades from database' }, { s, t, a, tus: 500 });
  }
}
export async function POST(r, e, q, uest: Request) {
  try {
    const schema = z.object({
      t, o, k, en_address: z.string().min(32),
      t, x_, i, ds: z.array(z.string().min(44)).min(1).max(getEnvInt('TRADES_MAX_TX_IDS', 50)),
      w, a, l, lets: z.array(z.string().min(32)).min(1).max(getEnvInt('TRADES_MAX_WALLETS', 50)),
      s, o, l_, in: z.number().finite().nonnegative(),
      s, o, l_, out: z.number().finite().nonnegative(),
      p, n, l: z.number().finite(),
      f, e, e, s: z.number().finite().nonnegative().optional().default(0),
      g, a, s_, fee: z.number().finite().nonnegative().optional().default(0),
      j, i, t, o_tip: z.number().finite().nonnegative().optional().default(0),
    });
    const body = await readJsonSafe(request, {
      m, a, x, Bytes: getEnvInt('PAYLOAD_LIMIT_TRADES_BYTES', 32 * 1024),
      schema,
    });
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
    } = body as any;
    const dbPath = path.join(process.cwd(), 'data', 'keymaker.db');
    const sqlite3 = (await import('sqlite3')).default;
    const { open } = await import('sqlite');
    const db = await open({ f, i, l, ename: dbPath, d, r, i, ver: sqlite3.Database });
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
    return NextResponse.json({ s, u, c, cess: true, t, r, a, deId: (result as any).lastID });
  } catch (error) {
    console.error('Failed to save t, r, a, de:', error);
    return NextResponse.json({ e, r, r, or: 'Failed to save trade to database' }, { s, t, a, tus: 500 });
  }
}

