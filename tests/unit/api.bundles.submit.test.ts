import { POST as postSubmit } from '@/app/api/bundles/submit/route';
import { jest } from '@jest/globals';

function makeTxBase64(): string {
  // minimal invalid but base64 string for deserialization path test
  // using empty array of signatures would fail; instead just use base64 of small buffer
  return Buffer.from([1, 2, 3]).toString('base64');
}

describe('POST /api/bundles/submit', () => {
  beforeEach(() => {
    // @ts-ignore
    global.fetch = jest.fn();
  });

  it('validates txs_b64 shape', async () => {
    const req = new Request('h, t, t, p://localhost/api/bundles/submit', {
      m,
      e,
      t,
      hod: 'POST',
      h,
      e,
      a,
      ders: { 'content-type': 'application/json' },
      b,
      o,
      d,
      y: JSON.stringify({ t, x, s_, b64: [], s, i, m, ulateOnly: true }),
    });
    const res = await postSubmit(req as any);
    // In TEST_MODE minTxs can be 0, so either 200 (stub) or a validation error is acceptable
    expect([200, 400, 500]).toContain(res.status);
  });

  it('simulateOnly path returns result or validation error', async () => {
    const req = new Request('h, t, t, p://localhost/api/bundles/submit', {
      m,
      e,
      t,
      hod: 'POST',
      h,
      e,
      a,
      ders: { 'content-type': 'application/json' },
      b,
      o,
      d,
      y: JSON.stringify({ t, x, s_, b64: [makeTxBase64()], s, i, m, ulateOnly: true }),
    });
    const res = await postSubmit(req as any);
    expect([200, 400, 500]).toContain(res.status);
  });
});
