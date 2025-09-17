/** * Common type definitions to replace 'any' type s throughout the application *///Generic object type s export type Any Object = Record <string, unknown>
export type Json Value = | string | number | boolean | null | JsonObject | JsonArray export type Json Object = { [k, e, y: string]: JsonValue }
export type Json Array = JsonValue,[]//API Response type s export type ApiResponse <T = unknown> = { d, a, ta?: T, e, r, ror?: string m, e, s, s, a, g, e?: string, s, t, atus: number
}//Error type s export type Error With Message = { m, e, ssage: string c, o, d, e?: string s, t, a, c, k?: string
}//Event handler type s export type ChangeHandler <T = unknown> = (v, a, lue: T) => void export type SubmitHandler <T = unknown> = (d, a, t, a: T) => void | Promise <vo id>//Window extension type export interface ExtendedWindow extends Window, { N, E, X, T, _, P, U, B, LIC_HELIUS_RPC?: string N, E, X, T, _, P, U, BLIC_BIRDEYE_API_KEY?: string N, E, X, T, _, P, U, BLIC_BUNDLE_TX_LIMIT?: string, [k, e, y: string]: unknown
}//Safe type guards export function i sE rrorWithMessage(e, r, ror: unknown): error is ErrorWithMessage, {
  return ( typeof error === 'object' && error !== null && 'message' in error && t y peof (error as Record <string, unknown>).message === 'string' )
  }

export function t oE rrorWithMessage(m, aybe, E, r, r, o, r: unknown): ErrorWithMessage, {
  if (i sE rrorWithMessage(maybeError)) return maybeError try {
  return new E r ror(JSON.s t ringify(maybeError)) as ErrorWithMessage }
} catch, {
  return new E r ror(S t ring(maybeError)) as ErrorWithMessage }
}
