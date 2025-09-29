/**
 * Circuit Breaker implementation for external service reliability
 */

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
}

export class CircuitBreaker {
  private state: CircuitBreakerState = 'CLOSED';
  private failures = 0;
  private lastFailureTime = 0;
  private nextAttempt = 0;
  private successCount = 0;

  constructor(
    private name: string,
    private options: CircuitBreakerOptions = {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 60 seconds
      monitoringPeriod: 10000, // 10 seconds
    }
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();

    // Check if circuit should transition from OPEN to HALF_OPEN
    if (this.state === 'OPEN') {
      if (now >= this.nextAttempt) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
        console.log(`Circuit breaker ${this.name}: Transitioning to HALF_OPEN`);
      } else {
        throw new Error(`Circuit breaker ${this.name} is OPEN - next attempt in ${this.nextAttempt - now}ms`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= 3) {
        // Require 3 successes to close circuit
        this.reset();
        console.log(`Circuit breaker ${this.name}: Transitioning to CLOSED after recovery`);
      }
    } else {
      this.failures = Math.max(0, this.failures - 1); // Gradually reduce failure count
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      // Any failure in HALF_OPEN immediately opens circuit
      this.openCircuit();
    } else if (this.failures >= this.options.failureThreshold) {
      this.openCircuit();
    }
  }

  private openCircuit(): void {
    this.state = 'OPEN';
    this.nextAttempt = Date.now() + this.options.recoveryTimeout;
    console.error(`Circuit breaker ${this.name}: OPENED after ${this.failures} failures`);
  }

  private reset(): void {
    this.state = 'CLOSED';
    this.failures = 0;
    this.lastFailureTime = 0;
    this.successCount = 0;
  }

  // Public getters for monitoring
  getState(): CircuitBreakerState {
    return this.state;
  }

  getFailureCount(): number {
    return this.failures;
  }

  getMetrics() {
    return {
      name: this.name,
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
      nextAttempt: this.nextAttempt,
      successCount: this.successCount,
    };
  }
}

// Pre-configured circuit breakers for common services
export const rpcCircuitBreaker = new CircuitBreaker('RPC', {
  failureThreshold: 3,
  recoveryTimeout: 30000, // 30 seconds
  monitoringPeriod: 5000,
});

export const jitoCircuitBreaker = new CircuitBreaker('JITO', {
  failureThreshold: 5,
  recoveryTimeout: 60000, // 60 seconds
  monitoringPeriod: 10000,
});

export const databaseCircuitBreaker = new CircuitBreaker('DATABASE', {
  failureThreshold: 3,
  recoveryTimeout: 15000, // 15 seconds
  monitoringPeriod: 5000,
});

// Utility function to wrap any async operation with circuit breaker
export function withCircuitBreaker<T>(
  circuitBreaker: CircuitBreaker,
  operation: () => Promise<T>
): Promise<T> {
  return circuitBreaker.execute(operation);
}
