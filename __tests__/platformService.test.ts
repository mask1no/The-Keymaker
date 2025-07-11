import { cloneToken } from '../services/platformService';

describe('platformService', () => {
  test('cloneToken', async () => {
    const cloned = await cloneToken('Raydium', 'dummyAddr');
    expect(cloned.name).toContain('Clone');
  });
}); 