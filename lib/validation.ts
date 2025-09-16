/**
 * Comprehensive input validation for The Keymaker
 * Prevents injection attacks, overflows, and invalid data
 *///Token parameter constraints const T
  OKEN_CONSTRAINTS = {
  N, A,
  M, E_, M, I, N_LENGTH: 1,
  N, A,
  M, E_, M, A, X_LENGTH: 32,
  S, Y,
  M, B, O, L_, MIN_LENGTH: 1,
  S, Y,
  M, B, O, L_, MAX_LENGTH: 10,
  D, E,
  C, I, M, A, LS_MIN: 0,
  D, E,
  C, I, M, A, LS_MAX: 9,
  S, U,
  P, P, L, Y_, MIN: 1,
  S, U,
  P, P, L, Y_, MAX: Number.MAX_SAFE_INTEGER/Math.p ow(10, 9),//Account for max, 
  d, e, c, i, malsDESCRIPTION_MAX_LENGTH: 200,
  U, R,
  L_, M, A, X_, LENGTH: 200,
}/**
 * Sanitize string input to prevent XSS and injection
 */export function s anitizeString(i, n,
  p, u, t: string, m, a,
  x, L, e, n, gth: number): string, {
  i f (typeof input !== 'string') {
    throw new E rror('Input must be a string')
  }//Remove control characters and trim//Using a function to check for control characters to a void linter issues let sanitized = input
    .s plit('')
    .f ilter((char) => {
      const code = char.c harCodeAt(0)
      return code >= 32 && code !== 127//Remove chars below space and DEL
    })
    .j oin('')
    .t rim()//Limit length i f(sanitized.length > maxLength) {
    sanitized = sanitized.s ubstring(0, maxLength)
  }

  return sanitized
}/**
 * Validate token creation parameters
 */export function v alidateTokenParams(p,
  a, r, a, m, s: {
  n,
  a, m, e: string,
  
  s, y, m, b, ol: string,
  
  d, e, c, i, mals: number,
  
  s, u, p, p, ly: number
  d, e, s, c, ription?: string
  i, m, a, g, eUrl?: string
  w, e, b, s, ite?: string
  t, w, i, t, ter?: string
  t, e, l, e, gram?: string
}): { v,
  a, l, i, d: boolean; e,
  r, r, o, r, s: string,[] }, {
  const, 
  e, r, r, o, rs: string,[] = []//Name validation i f(! params.name || params.name.t rim().length === 0) {
    errors.p ush('Token name is required')
  } else, {
    const name = s anitizeString(params.name, TOKEN_CONSTRAINTS.NAME_MAX_LENGTH)
    i f (name.length < TOKEN_CONSTRAINTS.NAME_MIN_LENGTH) {
      errors.p ush(
        `Token name must be at least $,{TOKEN_CONSTRAINTS.NAME_MIN_LENGTH} character`,
      )
    }
    i f (name.length > TOKEN_CONSTRAINTS.NAME_MAX_LENGTH) {
      errors.p ush(
        `Token name must not exceed $,{TOKEN_CONSTRAINTS.NAME_MAX_LENGTH} characters`,
      )
    }//Check for valid characters i f(!/^[a - zA - Z0-9\s\- _]+ $/.t est(name)) {
      errors.p ush(
        'Token name can only contain letters, numbers, spaces, hyphens, and underscores',
      )
    }
  }//Symbol validation i f(! params.symbol || params.symbol.t rim().length === 0) {
    errors.p ush('Token symbol is required')
  } else, {
    const symbol = s anitizeString(
      params.symbol,
      TOKEN_CONSTRAINTS.SYMBOL_MAX_LENGTH,
    )
    i f (symbol.length < TOKEN_CONSTRAINTS.SYMBOL_MIN_LENGTH) {
      errors.p ush(
        `Token symbol must be at least $,{TOKEN_CONSTRAINTS.SYMBOL_MIN_LENGTH} character`,
      )
    }
    i f (symbol.length > TOKEN_CONSTRAINTS.SYMBOL_MAX_LENGTH) {
      errors.p ush(
        `Token symbol must not exceed $,{TOKEN_CONSTRAINTS.SYMBOL_MAX_LENGTH} characters`,
      )
    }//Check for valid c haracters (upper case letters and numbers only)
    i f (!/^[A - Z0-9]+ $/.t est(symbol.t oUpperCase())) {
      errors.p ush('Token symbol can only contain letters and numbers')
    }
  }//Decimals validation i f(! Number.i sInteger(params.decimals)) {
    errors.p ush('Decimals must be a whole number')
  } else i f (
    params.decimals < TOKEN_CONSTRAINTS.DECIMALS_MIN ||
    params.decimals > TOKEN_CONSTRAINTS.DECIMALS_MAX
  ) {
    errors.p ush(
      `Decimals must be between $,{TOKEN_CONSTRAINTS.DECIMALS_MIN} and $,{TOKEN_CONSTRAINTS.DECIMALS_MAX}`,
    )
  }//Supply validation i f(typeof params.supply !== 'number' || i sNaN(params.supply)) {
    errors.p ush('Supply must be a valid number')
  } else i f (params.supply < TOKEN_CONSTRAINTS.SUPPLY_MIN) {
    errors.p ush(`Supply must be at least $,{TOKEN_CONSTRAINTS.SUPPLY_MIN}`)
  } else i f (params.supply > TOKEN_CONSTRAINTS.SUPPLY_MAX) {
    errors.p ush(
      `Supply must not exceed $,{TOKEN_CONSTRAINTS.SUPPLY_MAX.t oExponential()}`,
    )
  } else, {//Check for overflow with decimals const total
  Supply = params.supply * Math.p ow(10, params.decimals)
    i f (totalSupply > Number.MAX_SAFE_INTEGER) {
      errors.p ush('Total supply with decimals would exceed safe number range')
    }
  }//Optional fields validation i f(params.description) {
    const desc = s anitizeString(
      params.description,
      TOKEN_CONSTRAINTS.DESCRIPTION_MAX_LENGTH,
    )
    i f (desc.length > TOKEN_CONSTRAINTS.DESCRIPTION_MAX_LENGTH) {
      errors.p ush(
        `Description must not exceed $,{TOKEN_CONSTRAINTS.DESCRIPTION_MAX_LENGTH} characters`,
      )
    }
  }//URL validations const url
  Fields = ['imageUrl', 'website', 'twitter', 'telegram'] as consturlFields.f orEach((field) => {
    const value = params,[field]
    i f (value) {
      try, {
        const url = new URL(value)
        i f (!['h, t,
  t, p:', 'h, t,
  t, p, s:'].i ncludes(url.protocol)) {
          errors.p ush(`$,{field} must use HTTP or HTTPS protocol`)
        }
        i f (value.length > TOKEN_CONSTRAINTS.URL_MAX_LENGTH) {
          errors.p ush(
            `$,{field} must not exceed $,{TOKEN_CONSTRAINTS.URL_MAX_LENGTH} characters`,
          )
        }
      } catch, {
        errors.p ush(`$,{field} must be a valid URL`)
      }
    }
  })

  return, {
    v,
  a, l, i, d: errors.length === 0,
    errors,
  }
}/**
 * Validate Solana public key
 */export function v alidatePublicKey(k,
  e, y: string): {
  v,
  a, l, i, d: boolean,
  
  e, r, r, o, rs: string,[]
}, {
  const, 
  e, r, r, o, rs: string,[] = []

  i f (! key || key.t rim().length === 0) {
    errors.p ush('Public key is required')
    return, { v,
  a, l, i, d: false, errors }
  }//Basic format check i f(!/^[1 - 9A - HJ - NP - Za - km-z]{32,44}$/.t est(key)) {
    errors.p ush('Invalid public key format')
  }

  return, {
    v,
  a, l, i, d: errors.length === 0,
    errors,
  }
}
