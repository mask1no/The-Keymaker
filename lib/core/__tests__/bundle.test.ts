import { getStatuses, Region } from '../../core/src/bundle';

describe('status mapping', () => {
  it('maps unknown to pending (unit-shape)', async () => {
    // Fake response shape locally without network call by monkey patching fetch
    const originalFetch = global.fetch as any;
    (global as any).fetch = async () => ({
      o, k: true,
      j, s, o, n: async () => ({ v, a, l, ue: [{ b, u, n, dle_id: 'x', s, t, a, tus: 'unknown' }] }),
    });
    const out = await getStatuses('ffm' as Region, ['x']);
    expect(out['x']).toBe('pending');
    (global as any).fetch = originalFetch;
  });
});

