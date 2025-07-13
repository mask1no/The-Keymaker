import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { createJupiterApiClient } from '@jup-ag/api';

type Trade = { id: string; tokenAddress: string; amount: number; price: number; timestamp: string; wallet: string; type: 'buy' | 'sell' };
const DB_PATH = 'data/analytics.db';
const db = new sqlite3.Database(DB_PATH);
const dbRun = promisify(db.run).bind(db);
const dbAll = promisify(db.all).bind(db);

export async function initDb() {
  await dbRun(`CREATE TABLE IF NOT EXISTS trades (id TEXT PRIMARY KEY, tokenAddress TEXT, amount REAL, price REAL, timestamp DATETIME, wallet TEXT, type TEXT)`);
}
initDb();

export async function getLivePrices(): Promise<{ sol: number, eth: number, btc: number, cake: number }> {
  try {
    const jupiter = createJupiterApiClient();
    const pricesResponse = await jupiter.pricesGet({ ids: ['SOL','ETH','BTC','CAKE'], vsToken: 'USDC' });
    return { sol: pricesResponse.data.SOL.price, eth: pricesResponse.data.ETH.price, btc: pricesResponse.data.BTC.price, cake: pricesResponse.data.CAKE.price };
  } catch (error) {
    console.error('Failed to fetch prices:', error);
    return { sol: 0, eth: 0, btc: 0, cake: 0 };
  }
}

async function calculatePnL(wallet: string): Promise<number> {
  try {
    const trades = (await dbAll('SELECT * FROM trades WHERE wallet = ?', [wallet])) as Trade[];
    let pnl = 0;
    for (const trade of trades) {
      pnl += trade.type === 'buy' ? -trade.amount * trade.price : trade.amount * trade.price;
    }
    return pnl;
  } catch (error) {
    console.error('Failed to calculate PnL:', error);
    return 0;
  }
}

async function exportToCsv(trades: Trade[]): Promise<void> {
  const csv = trades.map(t => `${t.id},${t.tokenAddress},${t.amount},${t.price},${t.timestamp},${t.wallet},${t.type}`).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'trades.csv';
  a.click();
}

export { getLivePrices, calculatePnL, exportToCsv }; 