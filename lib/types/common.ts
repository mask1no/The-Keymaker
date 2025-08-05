/**
 * Common type definitions to replace 'any' types throughout the application
 */

// Generic object types
export type AnyObject = Record<string, unknown>
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray
export type JsonObject = { [key: string]: JsonValue }
export type JsonArray = JsonValue[]

// API Response types
export type ApiResponse<T = unknown> = {
  data?: T
  error?: string
  message?: string
  status: number
}

// Error types
export type ErrorWithMessage = {
  message: string
  code?: string
  stack?: string
}

// Event handler types
export type ChangeHandler<T = unknown> = (value: T) => void
export type SubmitHandler<T = unknown> = (data: T) => void | Promise<void>

// Window extension type
export interface ExtendedWindow extends Window {
  NEXT_PUBLIC_HELIUS_RPC?: string
  NEXT_PUBLIC_BIRDEYE_API_KEY?: string
  NEXT_PUBLIC_BUNDLE_TX_LIMIT?: string
  [key: string]: unknown
}

// Safe type guards
export function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  )
}

export function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) return maybeError
  
  try {
    return new Error(JSON.stringify(maybeError)) as ErrorWithMessage
  } catch {
    return new Error(String(maybeError)) as ErrorWithMessage
  }
}