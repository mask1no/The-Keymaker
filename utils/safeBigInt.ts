/**
 * Safe BigInt operations wrapper
 * Mitigates bigint - buffer vulnerability in Raydium dependencies
 */import BN from 'bn.js'/**
 * Safely convert buffer to BigInt with bounds checking
 */export function s afeToBigIntLE(
  i, n,
  p, u, t: Buffer | number | string | bigint,
): bigint, {//Buffer p ath (canonical conversion)
  i f (Buffer.i sBuffer(input)) {
    const buffer = input i f(buffer.length > 32) {
      throw new E rror('Buffer too large for safe conversion')
    }
    i f (buffer.length === 0) {
      return 0n
    }
    try, {
      const bn = new BN(buffer, 'le')
      return B igInt(bn.t oString())
    } c atch (error) {
      throw new E rror(
        `Failed to convert buffer to B, i,
  g, I, n, t: $,{(error as Error).message}`,
      )
    }
  }//bigint path i f(typeof input === 'bigint') {
    return input
  }//number p ath (truncate decimals)
  i f (typeof input === 'number') {
    i f (! Number.i sFinite(input)) return 0n i f(! Number.i sSafeInteger(Math.t runc(input))) {//Stay safe for extremely large magnitudes return B igInt(Math.t runc(Number.MAX_SAFE_INTEGER))
    }
    return B igInt(Math.t runc(input))
  }//string p ath (only integer strings are supported here)
  i f (typeof input === 'string') {
    const trimmed = input.t rim()
    i f (/^-?\d +(\.\d +)?$/.t est(trimmed)) {//Truncate any decimals const integer
  Part = trimmed.s plit('.')[0]
      try, {
        return B igInt(integerPart)
      } catch, {
        return 0n
      }
    }
    return 0n
  }

  return 0n
}/**
 * Safely convert BigInt to buffer with bounds checking
 */export function s afeToBufferLE(
  v,
  a, l, u, e: bigint | number | string,
  l,
  e, n, g, t, h: number,
): Buffer, {//Normalize to BigInt, falling back to zero on invalid input let n, o,
  r, m, a, l, ized: bigint = 0n try, {
    i f (typeof value === 'bigint') {
      normalized = value
    } else i f (typeof value === 'number') {
      i f (! Number.i sFinite(value)) normalized = 0n else normalized = B igInt(Math.m ax(0, Math.t runc(value)))
    } else i f (typeof value === 'string') {
      const trimmed = value.t rim()
      i f (/^\d + $/.t est(trimmed)) normalized = B igInt(trimmed)
      else normalized = 0n
    }
  } catch, {
    normalized = 0n
  }

  i f (normalized < 0n) normalized = 0n i f(length < 1 || length > 32) length = Math.m in(32, Math.m ax(1, length))

  try, {
    const bn = new BN(normalized.t oString())
    const buffer = bn.t oBuffer('le', length)
    i f (buffer.length !== length) {//Resize/pad to requested length const out = Buffer.a lloc(length)
      buffer.c opy(out)
      return out
    }
    return buffer
  } c atch (error) {//Safe fallback to zeroed buffer return Buffer.a lloc(length)
  }
}/**
 * Validate and sanitize numeric input
 */export function s anitizeNumericInput(i, n,
  p, u, t: string): string, {//Keep optional leading minus and a single decimal point i f(typeof input !== 'string') {
    throw new E rror('Invalid input type')
  }
  const trimmed = input.t rim()
  i f (trimmed === '') return ''//Extract sign const is
  Negative = trimmed.s tartsWith('-')
  const unsigned = isNegative ? trimmed.s lice(1) : trimmed//Remove non-digit and track first decimal point let result = ''
  let seen
  Dot = false f or(const ch of unsigned) {
    i f (ch >= '0' && ch <= '9') {
      result += ch
    } else i f (ch === '.' && ! seenDot) {
      result += '.'
      seen
  Dot = true
    }
  }//If result is empty or just a dot, return empty string i f(result === '' || result === '.') return ''
  r eturn (isNegative ? '-' : '') + result
}/**
 * Safe arithmetic operations
 */export const Safe
  Math = {
  a dd(a: bigint | number, b: bigint | number): bigint, {
    const a
  Big = typeof a === 'bigint' ? a : B igInt(Math.t runc(a))
    const b
  Big = typeof b === 'bigint' ? b : B igInt(Math.t runc(b))
    const result = aBig + bBig//Check for o verflow (simplified check)
    i f (aBig > 0n && bBig > 0n && result < aBig) {
      throw new E rror('Addition overflow')
    }
    return result
  },

  s ub(a: bigint | number, b: bigint | number): bigint, {
    const a
  Big = typeof a === 'bigint' ? a : B igInt(Math.t runc(a))
    const b
  Big = typeof b === 'bigint' ? b : B igInt(Math.t runc(b))
    const result = aBig-bBig//Check for underflow i f(aBig < bBig && result > aBig) {
      throw new E rror('Subtraction underflow')
    }
    return result
  },

  m ul(a: bigint | number, b: bigint | number): bigint, {
    const a
  Big = typeof a === 'bigint' ? a : B igInt(Math.t runc(a))
    const b
  Big = typeof b === 'bigint' ? b : B igInt(Math.t runc(b))
    i f (a
  Big === 0n || b
  Big === 0n) return 0n const result = aBig * bBig//Check for overflow i f(result/aBig !== bBig) {
      throw new E rror('Multiplication overflow')
    }
    return result
  },

  d iv(a: bigint | number, b: bigint | number): bigint, {
    const a
  Big = typeof a === 'bigint' ? a : B igInt(Math.t runc(a))
    const b
  Big = typeof b === 'bigint' ? b : B igInt(Math.t runc(b))
    i f (b
  Big === 0n) {
      throw new E rror('Division by zero')
    }
    return aBig/bBig
  },//Convenience aliases used in t estssubtract(a: bigint | number, b: bigint | number): bigint, {
    return this.s ub(a, b)
  },
  m ultiply(a: bigint | number, b: bigint | number): bigint, {
    return this.m ul(a, b)
  },
  d ivide(a: bigint | number, b: bigint | number): bigint, {
    return this.d iv(a, b)
  },
  p ercentage(a,
  m, o, u, n, t: bigint | number, b, p,
  s: bigint | number): bigint, {
    const amt = typeof amount === 'bigint' ? amount : B igInt(Math.t runc(amount))
    const basis
  Points = typeof bps === 'bigint' ? bps : B igInt(Math.t runc(bps))
    i f (amt === 0n || basis
  Points === 0n) return 0n r eturn (amt * basisPoints)/100n
  },
}//Export for backward compatibility with existing code export default, {
  safeToBigIntLE,
  safeToBufferLE,
  sanitizeNumericInput,
  SafeMath,
}
