import { getLivePrices, calculatePnL, initDb } from '../services/analyticsService';

beforeAll(async () => await initDb());

describe('analyticsService', () => {
  it('gets live prices', async () => {
    const prices = await getLivePrices();
    expect(prices.sol).toBeGreaterThan(0);
  });

  it('calculates PnL', async () => {
    const pnl = await calculatePnL('wallet1');
    expect(typeof pnl).toBe('number');
  });
}); 