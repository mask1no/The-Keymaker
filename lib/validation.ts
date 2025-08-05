/**
 * Comprehensive input validation for The Keymaker
 * Prevents injection attacks, overflows, and invalid data
 */

import { LAMPORTS_PER_SOL } from '@solana/web3.js'

// Token parameter constraints
const TOKEN_CONSTRAINTS = {
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 32,
  SYMBOL_MIN_LENGTH: 1,
  SYMBOL_MAX_LENGTH: 10,
  DECIMALS_MIN: 0,
  DECIMALS_MAX: 9,
  SUPPLY_MIN: 1,
  SUPPLY_MAX: Number.MAX_SAFE_INTEGER / Math.pow(10, 9), // Account for max decimals
  DESCRIPTION_MAX_LENGTH: 200,
  URL_MAX_LENGTH: 200,
}

// Wallet constraints
const WALLET_CONSTRAINTS = {
  MAX_WALLETS_PER_GROUP: 50,
  MIN_PASSWORD_LENGTH: 12,
  MAX_PASSWORD_LENGTH: 128,
  GROUP_NAME_MAX_LENGTH: 50,
}

// Transaction constraints
const TRANSACTION_CONSTRAINTS = {
  MIN_SOL_AMOUNT: 0.000001, // 1 lamport
  MAX_SOL_AMOUNT: 1000000, // 1M SOL reasonable max
  MAX_BUNDLE_SIZE: 5, // Jito limit
  MIN_TIP_AMOUNT: 0.00001, // 10000 lamports
  MAX_TIP_AMOUNT: 1, // 1 SOL max tip
  MAX_SLIPPAGE_BPS: 5000, // 50% max slippage
}

/**
 * Sanitize string input to prevent XSS and injection
 */
export function sanitizeString(input: string, maxLength: number): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string')
  }

  // Remove control characters and trim
  // Using a function to check for control characters to avoid linter issues
  let sanitized = input
    .split('')
    .filter((char) => {
      const code = char.charCodeAt(0)
      return code >= 32 && code !== 127 // Remove chars below space and DEL
    })
    .join('')
    .trim()

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }

  return sanitized
}

/**
 * Validate token creation parameters
 */
export function validateTokenParams(params: {
  name: string
  symbol: string
  decimals: number
  supply: number
  description?: string
  imageUrl?: string
  website?: string
  twitter?: string
  telegram?: string
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Name validation
  if (!params.name || params.name.trim().length === 0) {
    errors.push('Token name is required')
  } else {
    const name = sanitizeString(params.name, TOKEN_CONSTRAINTS.NAME_MAX_LENGTH)
    if (name.length < TOKEN_CONSTRAINTS.NAME_MIN_LENGTH) {
      errors.push(
        `Token name must be at least ${TOKEN_CONSTRAINTS.NAME_MIN_LENGTH} character`,
      )
    }
    if (name.length > TOKEN_CONSTRAINTS.NAME_MAX_LENGTH) {
      errors.push(
        `Token name must not exceed ${TOKEN_CONSTRAINTS.NAME_MAX_LENGTH} characters`,
      )
    }
    // Check for valid characters
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
      errors.push(
        'Token name can only contain letters, numbers, spaces, hyphens, and underscores',
      )
    }
  }

  // Symbol validation
  if (!params.symbol || params.symbol.trim().length === 0) {
    errors.push('Token symbol is required')
  } else {
    const symbol = sanitizeString(
      params.symbol,
      TOKEN_CONSTRAINTS.SYMBOL_MAX_LENGTH,
    )
    if (symbol.length < TOKEN_CONSTRAINTS.SYMBOL_MIN_LENGTH) {
      errors.push(
        `Token symbol must be at least ${TOKEN_CONSTRAINTS.SYMBOL_MIN_LENGTH} character`,
      )
    }
    if (symbol.length > TOKEN_CONSTRAINTS.SYMBOL_MAX_LENGTH) {
      errors.push(
        `Token symbol must not exceed ${TOKEN_CONSTRAINTS.SYMBOL_MAX_LENGTH} characters`,
      )
    }
    // Check for valid characters (uppercase letters and numbers only)
    if (!/^[A-Z0-9]+$/.test(symbol.toUpperCase())) {
      errors.push('Token symbol can only contain letters and numbers')
    }
  }

  // Decimals validation
  if (!Number.isInteger(params.decimals)) {
    errors.push('Decimals must be a whole number')
  } else if (
    params.decimals < TOKEN_CONSTRAINTS.DECIMALS_MIN ||
    params.decimals > TOKEN_CONSTRAINTS.DECIMALS_MAX
  ) {
    errors.push(
      `Decimals must be between ${TOKEN_CONSTRAINTS.DECIMALS_MIN} and ${TOKEN_CONSTRAINTS.DECIMALS_MAX}`,
    )
  }

  // Supply validation
  if (typeof params.supply !== 'number' || isNaN(params.supply)) {
    errors.push('Supply must be a valid number')
  } else if (params.supply < TOKEN_CONSTRAINTS.SUPPLY_MIN) {
    errors.push(`Supply must be at least ${TOKEN_CONSTRAINTS.SUPPLY_MIN}`)
  } else if (params.supply > TOKEN_CONSTRAINTS.SUPPLY_MAX) {
    errors.push(
      `Supply must not exceed ${TOKEN_CONSTRAINTS.SUPPLY_MAX.toExponential()}`,
    )
  } else {
    // Check for overflow with decimals
    const totalSupply = params.supply * Math.pow(10, params.decimals)
    if (totalSupply > Number.MAX_SAFE_INTEGER) {
      errors.push('Total supply with decimals would exceed safe number range')
    }
  }

  // Optional fields validation
  if (params.description) {
    const desc = sanitizeString(
      params.description,
      TOKEN_CONSTRAINTS.DESCRIPTION_MAX_LENGTH,
    )
    if (desc.length > TOKEN_CONSTRAINTS.DESCRIPTION_MAX_LENGTH) {
      errors.push(
        `Description must not exceed ${TOKEN_CONSTRAINTS.DESCRIPTION_MAX_LENGTH} characters`,
      )
    }
  }

  // URL validations
  const urlFields = ['imageUrl', 'website', 'twitter', 'telegram'] as const
  urlFields.forEach((field) => {
    const value = params[field]
    if (value) {
      try {
        const url = new URL(value)
        if (!['http:', 'https:'].includes(url.protocol)) {
          errors.push(`${field} must use HTTP or HTTPS protocol`)
        }
        if (value.length > TOKEN_CONSTRAINTS.URL_MAX_LENGTH) {
          errors.push(
            `${field} must not exceed ${TOKEN_CONSTRAINTS.URL_MAX_LENGTH} characters`,
          )
        }
      } catch {
        errors.push(`${field} must be a valid URL`)
      }
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate SOL amount
 */
export function validateSolAmount(
  amount: number,
  purpose: 'funding' | 'tip' | 'liquidity' | 'general' = 'general',
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (typeof amount !== 'number' || isNaN(amount)) {
    errors.push('Amount must be a valid number')
    return { valid: false, errors }
  }

  if (amount < TRANSACTION_CONSTRAINTS.MIN_SOL_AMOUNT) {
    errors.push(
      `Amount must be at least ${TRANSACTION_CONSTRAINTS.MIN_SOL_AMOUNT} SOL`,
    )
  }

  if (amount > TRANSACTION_CONSTRAINTS.MAX_SOL_AMOUNT) {
    errors.push(
      `Amount must not exceed ${TRANSACTION_CONSTRAINTS.MAX_SOL_AMOUNT} SOL`,
    )
  }

  // Purpose-specific validation
  if (purpose === 'tip') {
    if (amount < TRANSACTION_CONSTRAINTS.MIN_TIP_AMOUNT) {
      errors.push(
        `Tip amount must be at least ${TRANSACTION_CONSTRAINTS.MIN_TIP_AMOUNT} SOL`,
      )
    }
    if (amount > TRANSACTION_CONSTRAINTS.MAX_TIP_AMOUNT) {
      errors.push(
        `Tip amount must not exceed ${TRANSACTION_CONSTRAINTS.MAX_TIP_AMOUNT} SOL`,
      )
    }
  }

  // Check for precision issues
  const lamports = amount * LAMPORTS_PER_SOL
  if (!Number.isInteger(lamports)) {
    errors.push('Amount has too many decimal places (max 9 decimals)')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate wallet group name
 */
export function validateGroupName(name: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!name || name.trim().length === 0) {
    errors.push('Group name is required')
    return { valid: false, errors }
  }

  const sanitized = sanitizeString(
    name,
    WALLET_CONSTRAINTS.GROUP_NAME_MAX_LENGTH,
  )

  if (sanitized.length > WALLET_CONSTRAINTS.GROUP_NAME_MAX_LENGTH) {
    errors.push(
      `Group name must not exceed ${WALLET_CONSTRAINTS.GROUP_NAME_MAX_LENGTH} characters`,
    )
  }

  if (!/^[a-zA-Z0-9\s\-_]+$/.test(sanitized)) {
    errors.push(
      'Group name can only contain letters, numbers, spaces, hyphens, and underscores',
    )
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate bundle size
 */
export function validateBundleSize(size: number): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!Number.isInteger(size) || size < 1) {
    errors.push('Bundle size must be a positive integer')
  } else if (size > TRANSACTION_CONSTRAINTS.MAX_BUNDLE_SIZE) {
    errors.push(
      `Bundle size must not exceed ${TRANSACTION_CONSTRAINTS.MAX_BUNDLE_SIZE} transactions`,
    )
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate slippage tolerance
 */
export function validateSlippage(slippageBps: number): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!Number.isInteger(slippageBps) || slippageBps < 0) {
    errors.push('Slippage must be a non-negative integer in basis points')
  } else if (slippageBps > TRANSACTION_CONSTRAINTS.MAX_SLIPPAGE_BPS) {
    errors.push(
      `Slippage must not exceed ${TRANSACTION_CONSTRAINTS.MAX_SLIPPAGE_BPS} basis points (50%)`,
    )
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate Solana public key
 */
export function validatePublicKey(key: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!key || key.trim().length === 0) {
    errors.push('Public key is required')
    return { valid: false, errors }
  }

  // Basic format check
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(key)) {
    errors.push('Invalid public key format')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Sanitize and validate numeric input
 */
export function sanitizeNumber(
  input: string | number,
  min: number,
  max: number,
  decimals?: number,
): { value: number | null; errors: string[] } {
  const errors: string[] = []

  let value: number

  if (typeof input === 'string') {
    // Remove any non-numeric characters except decimal point
    const cleaned = input.replace(/[^0-9.-]/g, '')
    value = parseFloat(cleaned)
  } else {
    value = input
  }

  if (isNaN(value)) {
    errors.push('Invalid number')
    return { value: null, errors }
  }

  if (value < min) {
    errors.push(`Value must be at least ${min}`)
  }

  if (value > max) {
    errors.push(`Value must not exceed ${max}`)
  }

  if (decimals !== undefined) {
    const factor = Math.pow(10, decimals)
    value = Math.round(value * factor) / factor
  }

  return {
    value: errors.length === 0 ? value : null,
    errors,
  }
}

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map()

  constructor(
    private maxAttempts: number,
    private windowMs: number,
  ) {}

  check(key: string): boolean {
    const now = Date.now()
    const attempts = this.attempts.get(key) || []

    // Remove old attempts outside the window
    const validAttempts = attempts.filter((time) => now - time < this.windowMs)

    if (validAttempts.length >= this.maxAttempts) {
      return false
    }

    validAttempts.push(now)
    this.attempts.set(key, validAttempts)

    return true
  }

  reset(key: string): void {
    this.attempts.delete(key)
  }
}

// Export constraint constants for use in UI
export const CONSTRAINTS = {
  TOKEN: TOKEN_CONSTRAINTS,
  WALLET: WALLET_CONSTRAINTS,
  TRANSACTION: TRANSACTION_CONSTRAINTS,
}
