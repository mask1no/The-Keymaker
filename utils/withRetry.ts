import { logger } from '@/lib/logger'

export interface RetryOptions {
	maxRetries?: number
	delayMs?: number
	exponentialBackoff?: boolean
	shouldRetry?: (error: unknown) => boolean
	onRetry?: (error: unknown, attempt: number) => void
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry' | 'shouldRetry'>> & {
	shouldRetry: (error: unknown) => boolean
} = {
	maxRetries: 3,
	delayMs: 1000,
	exponentialBackoff: true,
	shouldRetry: isRetryableError,
}

/**
 * Wraps a function with retry logic using optional exponential backoff
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
			const shouldStop = attempt === config.maxRetries || !config.shouldRetry(error)
			if (shouldStop) {
				throw error
			}

			const delay = config.exponentialBackoff
				? config.delayMs * Math.pow(2, attempt)
				: config.delayMs

			logger.warn(`Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay} ms`, {
				error: error instanceof Error ? error.message : String(error),
			})

			if (typeof options.onRetry === 'function') {
				try {
					options.onRetry(error, attempt + 1)
				} catch {
					// ignore onRetry errors
				}
			}

			await new Promise((resolve) => setTimeout(resolve, delay))
		}
	}

	// Should never get here, but satisfy TS
	throw lastError as unknown as Error
}

/**
 * Decide if an error is retryable
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
		if (message.includes('rate limit') || message.includes('too many requests')) {
			return true
		}
		// Temporary/service unavailable
		if (message.includes('temporary') || message.includes('unavailable')) {
			return true
		}
	}

	// HTTP-style response objects
	if (typeof error === 'object' && error !== null && 'response' in (error as any)) {
		const response = (error as any).response as { status?: number } | undefined
		if (response?.status) {
			return response.status >= 500 || response.status === 429
		}
	}

	return false
}