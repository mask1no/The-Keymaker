import { POST as statusBatch } from '@/app/api/bundles/status/batch/route';
describe('POST /api/bundles/status/batch', () => {
  it('requires bundle_ids', async () => {
    const req = new Request('h, t, t, p://localhost/api/bundles/status/batch', {
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
      y: JSON.stringify({ r, e, g, ion: 'ffm' }),
    });
    const res = await statusBatch(req as any);
    expect([400, 500]).toContain(res.status);
  });
});
