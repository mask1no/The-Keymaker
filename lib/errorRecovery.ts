import { withCircuitBreaker, rpcCircuitBreaker, jitoCircuitBreaker } from './circuitBreaker';
import { recordError } from './monitoring';

/**
 * Exponential backoff retry mechanism
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    shouldRetry?: (error: any) => boolean;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    shouldRetry = () => true,
  } = options;

  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts || !shouldRetry(error)) {
        recordError('retry_exhausted', 'high', 'error_recovery');
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt - 1),
        maxDelay
      );

      recordError('retry_attempt', 'low', 'error_recovery');
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Graceful degradation wrapper
 */
export async function withGracefulDegradation<T>(
  primaryOperation: () => Promise<T>,
  fallbackOperation: () => Promise<T>,
  fallbackValue?: T
): Promise<T> {
  try {
    return await primaryOperation();
  } catch (error) {
    recordError('primary_operation_failed', 'medium', 'error_recovery');
    
    try {
      return await fallbackOperation();
    } catch (fallbackError) {
      recordError('fallback_operation_failed', 'high', 'error_recovery');
      
      if (fallbackValue !== undefined) {
        recordError('using_fallback_value', 'medium', 'error_recovery');
        return fallbackValue;
      }
      
      throw fallbackError;
    }
  }
}

/**
 * RPC operation with circuit breaker and retry
 */
export async function rpcWithRecovery<T>(
  operation: () => Promise<T>,
  fallback?: () => Promise<T>
): Promise<T> {
  const wrappedOperation = () => withCircuitBreaker(rpcCircuitBreaker, operation);
  
  if (fallback) {
    return withGracefulDegradation(
      () => withRetry(wrappedOperation, {
        maxAttempts: 2,
        shouldRetry: (error) => !error.message?.includes('Circuit breaker')
      }),
      fallback
    );
  }
  
  return withRetry(wrappedOperation, {
    maxAttempts: 3,
    shouldRetry: (error) => !error.message?.includes('Circuit breaker')
  });
}

/**
 * Jito operation with circuit breaker and retry
 */
export async function jitoWithRecovery<T>(
  operation: () => Promise<T>,
  fallback?: () => Promise<T>
): Promise<T> {
  const wrappedOperation = () => withCircuitBreaker(jitoCircuitBreaker, operation);
  
  if (fallback) {
    return withGracefulDegradation(
      () => withRetry(wrappedOperation, {
        maxAttempts: 3,
        baseDelay: 2000,
        shouldRetry: (error) => !error.message?.includes('Circuit breaker')
      }),
      fallback
    );
  }
  
  return withRetry(wrappedOperation, {
    maxAttempts: 3,
    baseDelay: 2000,
    shouldRetry: (error) => !error.message?.includes('Circuit breaker')
  });
}

/**
 * Health check with timeout and fallback
 */
export async function healthCheckWithTimeout<T>(
  check: () => Promise<T>,
  timeoutMs = 5000,
  fallbackValue?: T
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Health check timeout')), timeoutMs);
  });

  try {
    return await Promise.race([check(), timeoutPromise]);
  } catch (error) {
    recordError('health_check_timeout', 'medium', 'error_recovery');
    
    if (fallbackValue !== undefined) {
      return fallbackValue;
    }
    
    throw error;
  }
}

/**
 * Bulk operation with partial success handling
 */
export async function withPartialSuccess<T>(
  operations: (() => Promise<T>)[],
  options: {
    minSuccessRate?: number;
    continueOnError?: boolean;
  } = {}
): Promise<{ results: T[]; errors: any[]; successRate: number }> {
  const { minSuccessRate = 0.5, continueOnError = true } = options;
  
  const results: T[] = [];
  const errors: any[] = [];

  for (const operation of operations) {
    try {
      const result = await operation();
      results.push(result);
    } catch (error) {
      errors.push(error);
      recordError('bulk_operation_partial_failure', 'low', 'error_recovery');
      
      if (!continueOnError) {
        break;
      }
    }
  }

  const successRate = results.length / operations.length;
  
  if (successRate < minSuccessRate) {
    recordError('bulk_operation_insufficient_success', 'high', 'error_recovery');
    throw new Error(`Bulk operation failed: ${successRate * 100}% success rate below minimum ${minSuccessRate * 100}%`);
  }

  return { results, errors, successRate };
}

