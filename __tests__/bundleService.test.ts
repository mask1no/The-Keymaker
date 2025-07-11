import { buildBundle, previewBundle, executeBundle } from '../services/bundleService';
import { Transaction } from '@solana/web3.js';

describe('bundleService', () => {
  test('buildBundle', () => {
    const txs = [new Transaction()];
    const bundled = buildBundle(txs);
    expect(bundled.length).toBe(1);
  });

  // Add more tests
}); 