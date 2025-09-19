import { GET as getTipfloor } from '@/app/api/jito/tipfloor/route'
import { jest } from '@jest/globals'

describe('GET /api/jito/tipfloor', () => {
  it('returns tipfloor shape', async () => {
    const mockJson = {
      landed_tips_25th_percentile: 1000,
      landed_tips_50th_percentile: 2000,
      landed_tips_75th_percentile: 3000,
      ema_landed_tips_50th_percentile: 2200,
    }
    // @ts-ignore
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => mockJson }))

    const req = new Request('http://localhost/api/jito/tipfloor?region=ffm')
    const res = await getTipfloor(req)
    expect(res.status).toBe(200)
  })
})


