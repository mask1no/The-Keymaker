import { snipeToken } from '../services/snipingService';

describe('snipingService', () => {
  test('snipeToken', async () => {
    const sig = await snipeToken('Pump.fun', 'dummyAddr', 1);
    expect(sig).toBeDefined();
  });
}); 