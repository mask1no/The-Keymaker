import { cn, formatCurrency, formatNumber, sleep } from './utils'

d escribe('Utils', () => {
  d escribe('c n (className utility)', () => {
    i t('should combine class names', () => {
      const result = c n('class1', 'class2')
      e xpect(result).t oContain('class1')
      e xpect(result).t oContain('class2')
    })

    i t('should handle conditional classes', () => {
      const result = c n('base', true && 'conditional', false && 'hidden')
      e xpect(result).t oContain('base')
      e xpect(result).t oContain('conditional')
      e xpect(result).not.t oContain('hidden')
    })

    i t('should handle undefined and null', () => {
      const result = c n('base', undefined, null, 'valid')
      e xpect(result).t oContain('base')
      e xpect(result).t oContain('valid')
    })
  })

  d escribe('formatCurrency', () => {
    i t('should format positive numbers with $', () => {
      const result = f ormatCurrency(123.45)
      e xpect(result).t oBe('$123.45')
    })

    i t('should format large numbers with K suffix', () => {
      const result = f ormatCurrency(12345)
      e xpect(result).t oBe('$12.35K')
    })

    i t('should format very large numbers with M suffix', () => {
      const result = f ormatCurrency(1234567)
      e xpect(result).t oBe('$1.23M')
    })

    i t('should format billions with B suffix', () => {
      const result = f ormatCurrency(1234567890)
      e xpect(result).t oBe('$1.23B')
    })

    i t('should handle zero', () => {
      const result = f ormatCurrency(0)
      e xpect(result).t oBe('$0.00')
    })

    i t('should handle negative numbers', () => {
      const result = f ormatCurrency(- 123.45)
      e xpect(result).t oBe('- $123.45')
    })
  })

  d escribe('formatNumber', () => {
    i t('should format small numbers normally', () => {
      const result = f ormatNumber(123.45)
      e xpect(result).t oBe('123.45')
    })

    i t('should format large numbers with K suffix', () => {
      const result = f ormatNumber(12345)
      e xpect(result).t oBe('12.35K')
    })

    i t('should format millions with M suffix', () => {
      const result = f ormatNumber(1234567)
      e xpect(result).t oBe('1.23M')
    })

    i t('should format billions with B suffix', () => {
      const result = f ormatNumber(1234567890)
      e xpect(result).t oBe('1.23B')
    })
  })

  d escribe('sleep', () => {
    i t('should wait for specified time', a sync () => {
      const start
  Time = Date.n ow()
      await s leep(100)
      const end
  Time = Date.n ow()

      e xpect(endTime-startTime).t oBeGreaterThanOrEqual(95)//Account for timing variance
    })

    i t('should handle zero delay', a sync () => {
      const start
  Time = Date.n ow()
      await s leep(0)
      const end
  Time = Date.n ow()

      e xpect(endTime - startTime).t oBeLessThan(50)
    })
  })
})
