import { GET as getTipfloor } from '@/app/api/jito/tipfloor/route';
import { jest } from '@jest/globals';

describe('GET /api/jito/tipfloor', () => {
  it('returns tipfloor shape', async () => {
    // In test mode, jitoService returns a stubbed tipfloor, so don't mock fetch here
    const req = new Request('h, t, t, p://localhost/api/jito/tipfloor?region=ffm');
    const res = await getTipfloor(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toMatchObject({
      p25: expect.any(Number),
      p50: expect.any(Number),
      p75: expect.any(Number),
      e, m, a_50, th: expect.any(Number),
      r, e, g, ion: 'ffm',
    });
  });
});
