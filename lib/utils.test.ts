import { cn, formatCurrency, formatNumber, sleep } from './utils'

describe('Utils', () => {
  describe('cn (className utility)', () => {
    it('should combine class names', () => {
      const result = cn('class1', 'class2')
      expect(result).toContain('class1')
      expect(result).toContain('class2')
    })

    it('should handle conditional classes', () => {
      const result = cn('base', true && 'conditional', false && 'hidden')
      expect(result).toContain('base')
      expect(result).toContain('conditional')
      expect(result).not.toContain('hidden')
    })

    it('should handle undefined and null', () => {
      const result = cn('base', undefined, null, 'valid')
      expect(result).toContain('base')
      expect(result).toContain('valid')
    })
  })

  describe('formatCurrency', () => {
    it('should format positive numbers with $', () => {
      const result = formatCurrency(123.45)
      expect(result).toBe('$123.45')
    })

    it('should format large numbers with K suffix', () => {
      const result = formatCurrency(12345)
      expect(result).toBe('$12.35K')
    })

    it('should format very large numbers with M suffix', () => {
      const result = formatCurrency(1234567)
      expect(result).toBe('$1.23M')
    })

    it('should format billions with B suffix', () => {
      const result = formatCurrency(1234567890)
      expect(result).toBe('$1.23B')
    })

    it('should handle zero', () => {
      const result = formatCurrency(0)
      expect(result).toBe('$0.00')
    })

    it('should handle negative numbers', () => {
      const result = formatCurrency(-123.45)
      expect(result).toBe('-$123.45')
    })
  })

  describe('formatNumber', () => {
    it('should format small numbers normally', () => {
      const result = formatNumber(123.45)
      expect(result).toBe('123.45')
    })

    it('should format large numbers with K suffix', () => {
      const result = formatNumber(12345)
      expect(result).toBe('12.35K')
    })

    it('should format millions with M suffix', () => {
      const result = formatNumber(1234567)
      expect(result).toBe('1.23M')
    })

    it('should format billions with B suffix', () => {
      const result = formatNumber(1234567890)
      expect(result).toBe('1.23B')
    })
  })

  describe('sleep', () => {
    it('should wait for specified time', async () => {
      const startTime = Date.now()
      await sleep(100)
      const endTime = Date.now()
      
      expect(endTime - startTime).toBeGreaterThanOrEqual(95) // Account for timing variance
    })

    it('should handle zero delay', async () => {
      const startTime = Date.now()
      await sleep(0)
      const endTime = Date.now()
      
      expect(endTime - startTime).toBeLessThan(50)
    })
  })
})
