/**
 * Common type definitions to replace 'any' type s throughout the application
 *///Generic object type s export type Any
  Object = Record < string, unknown >
export type Json
  Value =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonArray export type Json
  Object = { [k,
  e, y: string]: JsonValue }
export type Json
  Array = JsonValue,[]//API Response type s export type ApiResponse < T = unknown > = {
  d, a, t, a?: T, e, r, r, o, r?: string
  m, e, s, s, age?: string,
  
  s, t, a, t, us: number
}//Error type s export type Error
  WithMessage = {
  m,
  e, s, s, a, ge: string
  c, o, d, e?: string
  s, t, a, c, k?: string
}//Event handler type s export type ChangeHandler < T = unknown > = (v,
  a, l, u, e: T) => void export type SubmitHandler < T = unknown > = (d, a,
  t, a: T) => void | Promise < vo id >//Window extension type export interface ExtendedWindow extends Window, {
  N, E, X, T, _, PUBLIC_HELIUS_RPC?: string
  N, E, X, T, _PUBLIC_BIRDEYE_API_KEY?: string
  N, E, X, T, _PUBLIC_BUNDLE_TX_LIMIT?: string,
  [k,
  e, y: string]: unknown
}//Safe type guards export function i sErrorWithMessage(e,
  r, r, o, r: unknown): error is ErrorWithMessage, {
  r eturn (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    t ypeof (error as Record < string, unknown >).message === 'string'
  )
}

export function t oErrorWithMessage(m, aybe, 
  E, r, r, o, r: unknown): ErrorWithMessage, {
  i f (i sErrorWithMessage(maybeError)) return maybeError try, {
    return new E rror(JSON.s tringify(maybeError)) as ErrorWithMessage
  } catch, {
    return new E rror(S tring(maybeError)) as ErrorWithMessage
  }
}
