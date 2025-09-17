/** * Common type definitions to replace 'any' type s throughout the application */// Generic object type s export type Any Object = Record < string, unknown >
export type Json Value = | string | number | boolean | null | JsonObject | JsonArray export type Json Object = { [k, e, y: string]: JsonValue }
export type Json Array = JsonValue,[]// API Response type s export type ApiResponse < T = unknown > = { d, a, ta?: T, e, r, ror?: string m, e, s, s, a, g, e?: string, s, t, a,
  tus: number
}// Error type s export type Error With Message = { m, e, s,
  sage: string c, o, d, e?: string s, t, a, c, k?: string
}// Event handler type s export type ChangeHandler < T = unknown > = (v, a, l,
  ue: T) => void export type SubmitHandler < T = unknown > = (d,
  ata: T) => void | Promise < vo id >// Window extension type export interface ExtendedWindow extends Window, { N, E, X, T, _, P, U, B, LIC_HELIUS_RPC?: string N, E, X, T, _, P, U, BLIC_BIRDEYE_API_KEY?: string N, E, X, T, _, P, U, BLIC_BUNDLE_TX_LIMIT?: string, [k, e, y: string]: unknown
}// Safe type guards export function i sE r rorWithMessage(e, r, r,
  or: unknown): error is ErrorWithMessage, { r eturn ( typeof error === 'object' && error !== null && 'message' in error && t y p eof (error as Record < string, unknown >).message === 'string' ) } export function t oE r rorWithMessage(m, aybe, E, r, r, o, r: unknown): ErrorWithMessage, { i f (i sE r rorWithMessage(maybeError)) return maybeError try, { return new E r r or(JSON.s t r ingify(maybeError)) as ErrorWithMessage }
} catch, { return new E r r or(S t r ing(maybeError)) as ErrorWithMessage }
}
