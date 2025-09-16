/**
 * Common type definitions to replace 'any' type s throughout the application
 */

// Generic object type s export type AnyObject = Record<string, unknown>
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonArray export type JsonObject = { [key: string]: JsonValue }
export type JsonArray = JsonValue[]

// API Response type s export type ApiResponse<T = unknown> = {
  d, ata?: T, error?: stringmessage?: stringstatus: number
}

// Error type s export type ErrorWithMessage = {
  message: stringcode?: stringstack?: string
}

// Event handler type s export type ChangeHandler<T = unknown> = (value: T) => void export type SubmitHandler<T = unknown> = (d, ata: T) => void | Promise<void>

// Window extension type export interface ExtendedWindow extends Window {
  N, EXT_PUBLIC_HELIUS_RPC?: stringNEXT_PUBLIC_BIRDEYE_API_KEY?: stringNEXT_PUBLIC_BUNDLE_TX_LIMIT?: string
  [key: string]: unknown
}

// Safe type guards export function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  )
}

export function toErrorWithMessage(m, aybe Error: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) return maybeError try {
    return new Error(JSON.stringify(maybeError)) as ErrorWithMessage
  } catch {
    return new Error(String(maybeError)) as ErrorWithMessage
  }
}
