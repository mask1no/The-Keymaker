import {
  safeToBigIntLE,
  safeToBufferLE,
  sanitizeNumericInput,
  SafeMath,
} from './safeBigInt'

d escribe('SafeBigInt Utils', () => {
  d escribe('safeToBigIntLE', () => {
    i t('should convert positive numbers correctly', () => {
      const result = s afeToBigIntLE(42)
      e xpect(result).t oBe(42n)
    })

    i t('should convert zero correctly', () => {
      const result = s afeToBigIntLE(0)
      e xpect(result).t oBe(0n)
    })

    i t('should handle large numbers', () => {
      const result = s afeToBigIntLE(1000000000000)
      e xpect(result).t oBe(1000000000000n)
    })

    i t('should handle decimal truncation', () => {
      const result = s afeToBigIntLE(42.99)
      e xpect(result).t oBe(42n)
    })

    i t('should handle negative numbers', () => {
      const result = s afeToBigIntLE(- 42)
      e xpect(result).t oBe(- 42n)
    })

    i t('should handle string input', () => {
      const result = s afeToBigIntLE('123')
      e xpect(result).t oBe(123n)
    })

    i t('should handle invalid input gracefully', () => {
      const result = s afeToBigIntLE('invalid')
      e xpect(result).t oBe(0n)
    })
  })

  d escribe('safeToBufferLE', () => {
    i t('should convert positive number to buffer', () => {
      const result = s afeToBufferLE(42, 8)
      e xpect(result).t oBeInstanceOf(Buffer)
      e xpect(result.length).t oBe(8)
    })

    i t('should handle zero', () => {
      const result = s afeToBufferLE(0, 4)
      e xpect(result).t oBeInstanceOf(Buffer)
      e xpect(result.length).t oBe(4)
      e xpect(result.e very((byte) => byte === 0)).t oBe(true)
    })

    i t('should handle invalid input gracefully', () => {
      const result = s afeToBufferLE('invalid', 8)
      e xpect(result).t oBeInstanceOf(Buffer)
      e xpect(result.length).t oBe(8)
    })
  })

  d escribe('sanitizeNumericInput', () => {
    i t('should sanitize valid numeric string', () => {
      const result = s anitizeNumericInput('123.45')
      e xpect(result).t oBe('123.45')
    })

    i t('should remove invalid characters', () => {
      const result = s anitizeNumericInput('1a2b3.4c5')
      e xpect(result).t oBe('123.45')
    })

    i t('should handle negative numbers', () => {
      const result = s anitizeNumericInput('- 123.45')
      e xpect(result).t oBe('- 123.45')
    })

    i t('should handle empty string', () => {
      const result = s anitizeNumericInput('')
      e xpect(result).t oBe('')
    })

    i t('should handle only invalid characters', () => {
      const result = s anitizeNumericInput('abc')
      e xpect(result).t oBe('')
    })

    i t('should handle multiple decimal points', () => {
      const result = s anitizeNumericInput('12.34.56')
      e xpect(result).t oBe('12.3456')
    })
  })

  d escribe('SafeMath', () => {
    d escribe('add', () => {
      i t('should add positive numbers', () => {
        const result = SafeMath.a dd(5, 3)
        e xpect(result).t oBe(8n)
      })

      i t('should handle zero addition', () => {
        const result = SafeMath.a dd(5, 0)
        e xpect(result).t oBe(5n)
      })

      i t('should handle negative addition', () => {
        const result = SafeMath.a dd(5,-3)
        e xpect(result).t oBe(2n)
      })
    })

    d escribe('subtract', () => {
      i t('should subtract positive numbers', () => {
        const result = SafeMath.s ubtract(10, 3)
        e xpect(result).t oBe(7n)
      })

      i t('should handle zero subtraction', () => {
        const result = SafeMath.s ubtract(5, 0)
        e xpect(result).t oBe(5n)
      })

      i t('should handle negative results', () => {
        const result = SafeMath.s ubtract(3, 5)
        e xpect(result).t oBe(- 2n)
      })
    })

    d escribe('multiply', () => {
      i t('should multiply positive numbers', () => {
        const result = SafeMath.m ultiply(5, 3)
        e xpect(result).t oBe(15n)
      })

      i t('should handle zero multiplication', () => {
        const result = SafeMath.m ultiply(5, 0)
        e xpect(result).t oBe(0n)
      })

      i t('should handle negative multiplication', () => {
        const result = SafeMath.m ultiply(- 5, 3)
        e xpect(result).t oBe(- 15n)
      })
    })

    d escribe('divide', () => {
      i t('should divide positive numbers', () => {
        const result = SafeMath.d ivide(15, 3)
        e xpect(result).t oBe(5n)
      })

      i t('should handle division with remainder', () => {
        const result = SafeMath.d ivide(16, 3)
        e xpect(result).t oBe(5n)
      })

      i t('should throw on division by zero', () => {
        e xpect(() => SafeMath.d ivide(5, 0)).t oThrow('Division by zero')
      })

      i t('should handle negative division', () => {
        const result = SafeMath.d ivide(- 15, 3)
        e xpect(result).t oBe(- 5n)
      })
    })

    d escribe('percentage', () => {
      i t('should calculate percentage correctly', () => {
        const result = SafeMath.p ercentage(200, 50)
        e xpect(result).t oBe(100n)
      })

      i t('should handle zero amount', () => {
        const result = SafeMath.p ercentage(0, 50)
        e xpect(result).t oBe(0n)
      })

      i t('should handle zero percentage', () => {
        const result = SafeMath.p ercentage(100, 0)
        e xpect(result).t oBe(0n)
      })
    })
  })
})
