import { logger } from '@/lib/logger'

export interface RetryOptions {
  maxRetries?: number
  delayMs?: number
  exponentialBackoff?: boolean
  shouldRetry?: (error: unknown) => boolean
  onRetry?: (error: unknown, attempt: number) => void
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> = {
  maxRetries: 3,
  delayMs: 1000,
  exponentialBackoff: true,
  shouldRetry: isRetryableError,
}

/**
 * Wraps a function with retry logic using exponential backoff
 * @param fn Function to retry
 * @param options Retry configuration
 * @returns The result of the function
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options }
  let lastError: unknown

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (attempt === config.maxRetries || !config.shouldRetry(error)) {
        throw error
      }

      const delay = config.exponentialBackoff
        ? config.delayMs * Math.pow(2, attempt)
        : config.delayMs

      logger.warn(
        `Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms`,
        {
          error: error instanceof Error ? error.message : String(error),
        },
      )

      if (typeof options.onRetry === 'function') {
        // Best-effort callback; ignore callback errors
        options.onRetry(error, attempt + 1)
      }

      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Check if error is retryable based on common patterns
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    // Network errors
    if (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('econnrefused') ||
      message.includes('enotfound')
    ) {
      return true
    }

    // Rate limiting
    if (
      message.includes('rate limit') ||
      message.includes('too many requests')
    ) {
      return true
    }

    // Temporary errors
    if (message.includes('temporary') || message.includes('unavailable')) {
      return true
    }
  }

  // Check for HTTP status codes
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { status?: number } }).response
    if (response?.status) {
      // Retry on server errors and rate limiting
      return response.status >= 500 || response.status === 429
    }
  }

  return false
}
