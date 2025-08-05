import { logger } from '@/lib/logger'

export interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  backoffMultiplier?: number
  maxDelay?: number
  shouldRetry?: (error: unknown) => boolean
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 30000,
  shouldRetry: () => true,
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

      const delay = Math.min(
        config.initialDelay * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelay,
      )

      logger.warn(
        `Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms`,
        {
          error: error instanceof Error ? error.message : String(error),
        },
      )

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
