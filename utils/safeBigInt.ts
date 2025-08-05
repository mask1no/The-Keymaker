/**
 * Safe BigInt operations wrapper
 * Mitigates bigint-buffer vulnerability in Raydium dependencies
 */

import BN from 'bn.js'

/**
 * Safely convert buffer to BigInt with bounds checking
 */
export function safeToBigIntLE(buffer: Buffer): bigint {
  // Validate buffer
  if (!Buffer.isBuffer(buffer)) {
    throw new Error('Input must be a Buffer')
  }

  // Check for reasonable buffer size (max 32 bytes for 256-bit numbers)
  if (buffer.length > 32) {
    throw new Error('Buffer too large for safe conversion')
  }

  // Check for empty buffer
  if (buffer.length === 0) {
    return BigInt(0)
  }

  try {
    // Convert using BN for safety, then to BigInt
    const bn = new BN(buffer, 'le')
    return BigInt(bn.toString())
  } catch (error) {
    throw new Error(
      `Failed to convert buffer to BigInt: ${(error as Error).message}`,
    )
  }
}

/**
 * Safely convert BigInt to buffer with bounds checking
 */
export function safeToBufferLE(value: bigint, length: number): Buffer {
  // Validate input
  if (typeof value !== 'bigint') {
    throw new Error('Value must be a BigInt')
  }

  // Check for negative values
  if (value < 0n) {
    throw new Error('Cannot convert negative BigInt to buffer')
  }

  // Check length bounds
  if (length < 1 || length > 32) {
    throw new Error('Buffer length must be between 1 and 32 bytes')
  }

  try {
    // Convert BigInt to BN, then to buffer
    const bn = new BN(value.toString())
    const buffer = bn.toBuffer('le', length)

    // Verify buffer length
    if (buffer.length !== length) {
      throw new Error('Buffer length mismatch')
    }

    return buffer
  } catch (error) {
    throw new Error(
      `Failed to convert BigInt to buffer: ${(error as Error).message}`,
    )
  }
}

/**
 * Validate and sanitize numeric input
 */
export function sanitizeNumericInput(input: string | number | bigint): bigint {
  try {
    // Handle different input types
    if (typeof input === 'bigint') {
      return input
    }

    if (typeof input === 'number') {
      // Check for safe integer range
      if (!Number.isSafeInteger(input)) {
        throw new Error('Number exceeds safe integer range')
      }
      return BigInt(Math.floor(input))
    }

    if (typeof input === 'string') {
      // Remove whitespace
      const cleaned = input.trim()

      // Validate numeric string
      if (!/^-?\d+$/.test(cleaned)) {
        throw new Error('Invalid numeric string')
      }

      return BigInt(cleaned)
    }

    throw new Error('Invalid input type')
  } catch (error) {
    throw new Error(`Failed to sanitize input: ${(error as Error).message}`)
  }
}

/**
 * Safe arithmetic operations
 */
export const SafeMath = {
  add(a: bigint, b: bigint): bigint {
    const result = a + b
    // Check for overflow (simplified check)
    if (a > 0n && b > 0n && result < a) {
      throw new Error('Addition overflow')
    }
    return result
  },

  sub(a: bigint, b: bigint): bigint {
    const result = a - b
    // Check for underflow
    if (a < b && result > a) {
      throw new Error('Subtraction underflow')
    }
    return result
  },

  mul(a: bigint, b: bigint): bigint {
    if (a === 0n || b === 0n) return 0n
    const result = a * b
    // Check for overflow
    if (result / a !== b) {
      throw new Error('Multiplication overflow')
    }
    return result
  },

  div(a: bigint, b: bigint): bigint {
    if (b === 0n) {
      throw new Error('Division by zero')
    }
    return a / b
  },
}

// Export for backward compatibility with existing code
export default {
  safeToBigIntLE,
  safeToBufferLE,
  sanitizeNumericInput,
  SafeMath,
}
