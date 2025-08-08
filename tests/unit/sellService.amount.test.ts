// Minimal unit test for sellService helper
// Isolate the helper from sqlite consumers by importing the named export only
import { calculatePnL } from '../../services/sellService'

describe('sellService helpers', () => {
  test('calculatePnL basic', () => {
    expect(calculatePnL(1, 1.1, 100)).toBeCloseTo(10)
    expect(calculatePnL(2, 1, 5)).toBeCloseTo(-50)
  })
})
