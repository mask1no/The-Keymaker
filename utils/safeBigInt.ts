import BN from 'bn.js';

// Safely convert buffer/number/string/bigint to bigint (little-endian for buffers)
export function safeToBigIntLE(input: Buffer | number | string | bigint): bigint {
  // Buffer path
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(input)) {
    const buffer = input as Buffer;
    if (buffer.length > 32) throw new Error('Buffer too large for safe conversion');
    if (buffer.length === 0) return 0n;
    try {
      const bn = new BN(buffer, 'le');
      return BigInt(bn.toString());
    } catch (error) {
      throw new Error(`Failed to convert buffer to BigInt: ${(error as Error).message}`);
    }
  }
  // bigint path
  if (typeof input === 'bigint') return input;
  // number path (truncate decimals)
  if (typeof input === 'number') {
    if (!Number.isFinite(input)) return 0n;
    return BigInt(Math.trunc(input));
  }
  // string path (handle optional decimals by truncating)
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
      const integerPart = trimmed.split('.')[0];
      try {
        return BigInt(integerPart);
      } catch {
        return 0n;
      }
    }
    return 0n;
  }
  return 0n;
}

// Safely convert BigInt-like to buffer (little-endian) with bounds checking
export function safeToBufferLE(value: bigint | number | string, length: number): Buffer {
  let normalized: bigint = 0n;
  try {
    if (typeof value === 'bigint') normalized = value;
    else if (typeof value === 'number') normalized = Number.isFinite(value) ? BigInt(Math.max(0, Math.trunc(value))) : 0n;
    else if (typeof value === 'string') normalized = /^\d+$/.test(value.trim()) ? BigInt(value.trim()) : 0n;
  } catch {
    normalized = 0n;
  }
  if (normalized < 0n) normalized = 0n;
  if (!Number.isInteger(length)) length = Math.trunc(length);
  if (length < 1 || length > 32) length = Math.min(32, Math.max(1, length));
  try {
    const bn = new BN(normalized.toString(), 10);
    const buf = bn.toArrayLike(Buffer, 'le', length);
    return buf;
  } catch {
    // Safe fallback to zeroed buffer
    return Buffer.alloc(length);
  }
}

// Validate and sanitize numeric input for user forms
export function sanitizeNumericInput(input: string): string {
  if (typeof input !== 'string') throw new Error('Invalid input type');
  const trimmed = input.trim();
  if (trimmed === '') return '';
  const isNegative = trimmed.startsWith('-');
  const unsigned = isNegative ? trimmed.slice(1) : trimmed;
  let result = '';
  let seenDot = false;
  for (const ch of unsigned) {
    if (ch >= '0' && ch <= '9') result += ch;
    else if (ch === '.' && !seenDot) {
      result += '.';
      seenDot = true;
    }
  }
  if (result === '' || result === '.') return '';
  return (isNegative ? '-' : '') + result;
}

// Safe arithmetic operations used across the app
export const SafeMath = {
  add(a: bigint | number, b: bigint | number): bigint {
    const aBig = typeof a === 'bigint' ? a : BigInt(Math.trunc(a));
    const bBig = typeof b === 'bigint' ? b : BigInt(Math.trunc(b));
    const result = aBig + bBig;
    // basic overflow detection (best-effort for positive operands)
    if (aBig > 0n && bBig > 0n && result < aBig) throw new Error('Addition overflow');
    return result;
  },
  sub(a: bigint | number, b: bigint | number): bigint {
    const aBig = typeof a === 'bigint' ? a : BigInt(Math.trunc(a));
    const bBig = typeof b === 'bigint' ? b : BigInt(Math.trunc(b));
    const result = aBig - bBig;
    // underflow detection for unsigned use-cases is handled by callers
    return result;
  },
  mul(a: bigint | number, b: bigint | number): bigint {
    const aBig = typeof a === 'bigint' ? a : BigInt(Math.trunc(a));
    const bBig = typeof b === 'bigint' ? b : BigInt(Math.trunc(b));
    if (aBig === 0n || bBig === 0n) return 0n;
    const result = aBig * bBig;
    if (result / aBig !== bBig) throw new Error('Multiplication overflow');
    return result;
  },
  div(a: bigint | number, b: bigint | number): bigint {
    const aBig = typeof a === 'bigint' ? a : BigInt(Math.trunc(a));
    const bBig = typeof b === 'bigint' ? b : BigInt(Math.trunc(b));
    if (bBig === 0n) throw new Error('Division by zero');
    return aBig / bBig;
  },
  // Convenience aliases used in tests
  subtract(a: bigint | number, b: bigint | number): bigint {
    return this.sub(a, b);
  },
  multiply(a: bigint | number, b: bigint | number): bigint {
    return this.mul(a, b);
  },
  divide(a: bigint | number, b: bigint | number): bigint {
    return this.div(a, b);
  },
  percentage(amount: bigint | number, bps: bigint | number): bigint {
    const amt = typeof amount === 'bigint' ? amount : BigInt(Math.trunc(amount));
    const basisPoints = typeof bps === 'bigint' ? bps : BigInt(Math.trunc(bps));
    if (amt === 0n || basisPoints === 0n) return 0n;
    return (amt * basisPoints) / 100n;
  },
};

const safeBigIntExports = { safeToBigIntLE, safeToBufferLE, sanitizeNumericInput, SafeMath };
export default safeBigIntExports;
