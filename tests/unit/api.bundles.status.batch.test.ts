import { POST as statusBatch } from '@/app/api/bundles/status/batch/route'

describe('POST /api/bundles/status/batch', () => {
  it('requires bundle_ids', async () => {
    const req = new Request('http://localhost/api/bundles/status/batch', {
      method: 'POST',
      body: JSON.stringify({ region: 'ffm' }),
    })
    const res = await statusBatch(req)
    expect(res.status).toBe(400)
  })
})


