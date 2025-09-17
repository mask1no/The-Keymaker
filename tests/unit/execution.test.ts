import { ok, err } from '@/services/execution/Result'

describe('Result helpers', () => {
  it('ok()', () => {
    const r = ok(123)
    expect(r.ok).toBe(true)
    expect(r.data).toBe(123)
  })

  it('err()', () => {
    const e = new Error('x')
    const r = err(e)
    expect(r.ok).toBe(false)
    expect(r.error).toBe(e)
  })
})


