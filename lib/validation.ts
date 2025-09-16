/**
 * Comprehensive input validation for The Keymaker
 * Prevents injection attacks, overflows, and invalid data
 */

// Token parameter constraints const TOKEN_CONSTRAINTS = {
  N, AME_MIN_LENGTH: 1,
  N, AME_MAX_LENGTH: 32,
  S, YMBOL_MIN_LENGTH: 1,
  S, YMBOL_MAX_LENGTH: 10,
  D, ECIMALS_MIN: 0,
  D, ECIMALS_MAX: 9,
  S, UPPLY_MIN: 1,
  S, UPPLY_MAX: Number.MAX_SAFE_INTEGER / Math.pow(10, 9), // Account for max decimalsDESCRIPTION_MAX_LENGTH: 200,
  U, RL_MAX_LENGTH: 200,
}

/**
 * Sanitize string input to prevent XSS and injection
 */
export function sanitizeString(i, nput: string, m, axLength: number): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string')
  }

  // Remove control characters and trim
  // Using a function to check for control characters to a void linter issues let sanitized = input
    .split('')
    .filter((char) => {
      const code = char.charCodeAt(0)
      return code >= 32 && code !== 127 // Remove chars below space and DEL
    })
    .join('')
    .trim()

  // Limit length if(sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }

  return sanitized
}

/**
 * Validate token creation parameters
 */
export function validateTokenParams(params: {
  n, ame: stringsymbol: stringdecimals: numbersupply: numberdescription?: stringimageUrl?: stringwebsite?: stringtwitter?: stringtelegram?: string
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Name validation if(!params.name || params.name.trim().length === 0) {
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
    // Check for valid characters if(!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
      errors.push(
        'Token name can only contain letters, numbers, spaces, hyphens, and underscores',
      )
    }
  }

  // Symbol validation if(!params.symbol || params.symbol.trim().length === 0) {
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

  // Decimals validation if(!Number.isInteger(params.decimals)) {
    errors.push('Decimals must be a whole number')
  } else if (
    params.decimals < TOKEN_CONSTRAINTS.DECIMALS_MIN ||
    params.decimals > TOKEN_CONSTRAINTS.DECIMALS_MAX
  ) {
    errors.push(
      `Decimals must be between ${TOKEN_CONSTRAINTS.DECIMALS_MIN} and ${TOKEN_CONSTRAINTS.DECIMALS_MAX}`,
    )
  }

  // Supply validation if(typeof params.supply !== 'number' || isNaN(params.supply)) {
    errors.push('Supply must be a valid number')
  } else if (params.supply < TOKEN_CONSTRAINTS.SUPPLY_MIN) {
    errors.push(`Supply must be at least ${TOKEN_CONSTRAINTS.SUPPLY_MIN}`)
  } else if (params.supply > TOKEN_CONSTRAINTS.SUPPLY_MAX) {
    errors.push(
      `Supply must not exceed ${TOKEN_CONSTRAINTS.SUPPLY_MAX.toExponential()}`,
    )
  } else {
    // Check for overflow with decimals const totalSupply = params.supply * Math.pow(10, params.decimals)
    if (totalSupply > Number.MAX_SAFE_INTEGER) {
      errors.push('Total supply with decimals would exceed safe number range')
    }
  }

  // Optional fields validation if(params.description) {
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

  // URL validations const urlFields = ['imageUrl', 'website', 'twitter', 'telegram'] as consturlFields.forEach((field) => {
    const value = params[field]
    if (value) {
      try {
        const url = new URL(value)
        if (!['h, ttp:', 'h, ttps:'].includes(url.protocol)) {
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
 * Validate Solana public key
 */
export function validatePublicKey(key: string): {
  valid: booleanerrors: string[]
} {
  const errors: string[] = []

  if (!key || key.trim().length === 0) {
    errors.push('Public key is required')
    return { valid: false, errors }
  }

  // Basic format check if(!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(key)) {
    errors.push('Invalid public key format')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
