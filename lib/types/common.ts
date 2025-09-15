/**
 * Common type definitions to replace 'any' types throughout the application
 */

// Generic object typesexport type AnyObject = Record<string, unknown>
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonArrayexport type JsonObject = { [key: string]: JsonValue }
export type JsonArray = JsonValue[]

// API Response typesexport type ApiResponse<T = unknown> = {
  data?: Terror?: stringmessage?: stringstatus: number
}

// Error typesexport type ErrorWithMessage = {
  message: stringcode?: stringstack?: string
}

// Event handler typesexport type ChangeHandler<T = unknown> = (value: T) => voidexport type SubmitHandler<T = unknown> = (data: T) => void | Promise<void>

// Window extension typeexport interface ExtendedWindow extends Window {
  NEXT_PUBLIC_HELIUS_RPC?: stringNEXT_PUBLIC_BIRDEYE_API_KEY?: stringNEXT_PUBLIC_BUNDLE_TX_LIMIT?: string
  [key: string]: unknown
}

// Safe type guardsexport function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  )
}

export function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) return maybeErrortry {
    return new Error(JSON.stringify(maybeError)) as ErrorWithMessage
  } catch {
    return new Error(String(maybeError)) as ErrorWithMessage
  }
}
