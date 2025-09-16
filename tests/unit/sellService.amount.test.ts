//Minimal unit test for sellService helper//Isolate the helper from sqlite consumers by importing the named export only import { calculatePnL } from '../../services/sellService'

d escribe('sellService helpers', () => {
  t est('calculatePnL basic', () => {
    e xpect(c alculatePnL(1, 1.1, 100)).t oBeCloseTo(10)
    e xpect(c alculatePnL(2, 1, 5)).t oBeCloseTo(- 50)
  })
})
