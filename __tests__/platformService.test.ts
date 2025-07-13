import { cloneToken } from '../services/platformService';

jest.mock('axios', () => ({ get: jest.fn().mockResolvedValue({ data: { name: 'test' } }) }));

describe('platformService', () => {
  it('clones token', async () => {
    const metadata = await cloneToken('Raydium', 'existingToken');
    expect(metadata.name).toBeDefined();
  });
}); 