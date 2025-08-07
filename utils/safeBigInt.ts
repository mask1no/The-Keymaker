/**
 * Safe BigInt operations wrapper
 * Mitigates bigint-buffer vulnerability in Raydium dependencies
 */

import BN from 'bn.js'

/**
 * Safely convert buffer to BigInt with bounds checking
 */
export function safeToBigIntLE(input: Buffer | number | string | bigint): bigint {
  // Buffer path (canonical conversion)
  if (Buffer.isBuffer(input)) {
    const buffer = input
    if (buffer.length > 32) {
      throw new Error('Buffer too large for safe conversion')
    }
    if (buffer.length === 0) {
      return 0n
    }
    try {
      const bn = new BN(buffer, 'le')
      return BigInt(bn.toString())
    } catch (error) {
      throw new Error(
        `Failed to convert buffer to BigInt: ${(error as Error).message}`,
      )
    }
  }

  // bigint path
  if (typeof input === 'bigint') {
    return input
  }

  // number path (truncate decimals)
  if (typeof input === 'number') {
    if (!Number.isFinite(input)) return 0n
    if (!Number.isSafeInteger(Math.trunc(input))) {
      // Stay safe for extremely large magnitudes
      return BigInt(Math.trunc(Number.MAX_SAFE_INTEGER))
    }
    return BigInt(Math.trunc(input))
  }

  // string path (only integer strings are supported here)
  if (typeof input === 'string') {
    const trimmed = input.trim()
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      // Truncate any decimals
      const integerPart = trimmed.split('.')[0]
      try {
        return BigInt(integerPart)
      } catch {
        return 0n
      }
    }
    return 0n
  }

  return 0n
}

/**
 * Safely convert BigInt to buffer with bounds checking
 */
export function safeToBufferLE(
  value: bigint | number | string,
  length: number,
): Buffer {
  // Normalize to BigInt, falling back to zero on invalid input
  let normalized: bigint = 0n
  try {
    if (typeof value === 'bigint') {
      normalized = value
    } else if (typeof value === 'number') {
      if (!Number.isFinite(value)) normalized = 0n
      else normalized = BigInt(Math.max(0, Math.trunc(value)))
    } else if (typeof value === 'string') {
      const trimmed = value.trim()
      if (/^\d+$/.test(trimmed)) normalized = BigInt(trimmed)
      else normalized = 0n
    }
  } catch {
    normalized = 0n
  }

  if (normalized < 0n) normalized = 0n
  if (length < 1 || length > 32) length = Math.min(32, Math.max(1, length))

  try {
    const bn = new BN(normalized.toString())
    const buffer = bn.toBuffer('le', length)
    if (buffer.length !== length) {
      // Resize/pad to requested length
      const out = Buffer.alloc(length)
      buffer.copy(out)
      return out
    }
    return buffer
  } catch (error) {
    // Safe fallback to zeroed buffer
    return Buffer.alloc(length)
  }
}

/**
 * Validate and sanitize numeric input
 */
export function sanitizeNumericInput(input: string): string {
  // Keep optional leading minus and a single decimal point
  if (typeof input !== 'string') {
    throw new Error('Invalid input type')
  }
  const trimmed = input.trim()
  if (trimmed === '') return ''
  // Extract sign
  const isNegative = trimmed.startsWith('-')
  const unsigned = isNegative ? trimmed.slice(1) : trimmed
  // Remove non-digit and track first decimal point
  let result = ''
  let seenDot = false
  for (const ch of unsigned) {
    if (ch >= '0' && ch <= '9') {
      result += ch
    } else if (ch === '.' && !seenDot) {
      result += '.'
      seenDot = true
    }
  }
  // If result is empty or just a dot, return empty string
  if (result === '' || result === '.') return ''
  return (isNegative ? '-' : '') + result
}

/**
 * Safe arithmetic operations
 */
export const SafeMath = {
  add(a: bigint | number, b: bigint | number): bigint {
    const aBig = typeof a === 'bigint' ? a : BigInt(Math.trunc(a))
    const bBig = typeof b === 'bigint' ? b : BigInt(Math.trunc(b))
    const result = aBig + bBig
    // Check for overflow (simplified check)
    if (aBig > 0n && bBig > 0n && result < aBig) {
      throw new Error('Addition overflow')
    }
    return result
  },

  sub(a: bigint | number, b: bigint | number): bigint {
    const aBig = typeof a === 'bigint' ? a : BigInt(Math.trunc(a))
    const bBig = typeof b === 'bigint' ? b : BigInt(Math.trunc(b))
    const result = aBig - bBig
    // Check for underflow
    if (aBig < bBig && result > aBig) {
      throw new Error('Subtraction underflow')
    }
    return result
  },

  mul(a: bigint | number, b: bigint | number): bigint {
    const aBig = typeof a === 'bigint' ? a : BigInt(Math.trunc(a))
    const bBig = typeof b === 'bigint' ? b : BigInt(Math.trunc(b))
    if (aBig === 0n || bBig === 0n) return 0n
    const result = aBig * bBig
    // Check for overflow
    if (result / aBig !== bBig) {
      throw new Error('Multiplication overflow')
    }
    return result
  },

  div(a: bigint | number, b: bigint | number): bigint {
    const aBig = typeof a === 'bigint' ? a : BigInt(Math.trunc(a))
    const bBig = typeof b === 'bigint' ? b : BigInt(Math.trunc(b))
    if (bBig === 0n) {
      throw new Error('Division by zero')
    }
    return aBig / bBig
  },

  // Convenience aliases used in tests
  subtract(a: bigint | number, b: bigint | number): bigint {
    return this.sub(a, b)
  },
  multiply(a: bigint | number, b: bigint | number): bigint {
    return this.mul(a, b)
  },
  divide(a: bigint | number, b: bigint | number): bigint {
    return this.div(a, b)
  },
  percentage(amount: bigint | number, bps: bigint | number): bigint {
    const amt = typeof amount === 'bigint' ? amount : BigInt(Math.trunc(amount))
    const basisPoints =
      typeof bps === 'bigint' ? bps : BigInt(Math.trunc(bps))
    if (amt === 0n || basisPoints === 0n) return 0n
    return (amt * basisPoints) / 100n
  },
}

// Export for backward compatibility with existing code
export default {
  safeToBigIntLE,
  safeToBufferLE,
  sanitizeNumericInput,
  SafeMath,
}
