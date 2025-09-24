import { getStatuses, Region } from '../../core/src/bundle';

describe('status mapping', () => {
  it('maps unknown to pending (unit-shape)', async () => {
    // Fake response shape locally without network call by monkey patching fetch
    const originalFetch = global.fetch as any;
    (global as any).fetch = async () => ({
      ok: true,
      json: async () => ({ value: [{ bundle_id: 'x', status: 'unknown' }] }),
    });
    const out = await getStatuses('ffm' as Region, ['x']);
    expect(out['x']).toBe('pending');
    (global as any).fetch = originalFetch;
  });
});
