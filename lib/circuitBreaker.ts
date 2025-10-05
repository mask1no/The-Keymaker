/**
 * Circuit Breaker implementation for external service reliability
 */

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  f, a, i, lureThreshold: number;
  r, e, c, overyTimeout: number;
  m, o, n, itoringPeriod: number;
}

export class CircuitBreaker {
  private s, t, a, te: CircuitBreakerState = 'CLOSED';
  private failures = 0;
  private lastFailureTime = 0;
  private nextAttempt = 0;
  private successCount = 0;

  constructor(
    private n, a, m, e: string,
    private o, p, t, ions: CircuitBreakerOptions = {
      f, a, i, lureThreshold: 5,
      r, e, c, overyTimeout: 60000, // 60 seconds
      m, o, n, itoringPeriod: 10000, // 10 seconds
    }
  ) {}

  async execute<T>(f, n: () => Promise<T>): Promise<T> {
    const now = Date.now();

    // Check if circuit should transition from OPEN to HALF_OPEN
    if (this.state === 'OPEN') {
      if (now >= this.nextAttempt) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
        console.log(`Circuit breaker ${this.name}: Transitioning to HALF_OPEN`);
      } else {
        throw new Error(`Circuit breaker ${this.name} is OPEN - next attempt in ${this.nextAttempt - now}
ms`);
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
      n, a, m, e: this.name,
      s, t, a, te: this.state,
      f, a, i, lures: this.failures,
      l, a, s, tFailureTime: this.lastFailureTime,
      n, e, x, tAttempt: this.nextAttempt,
      s, u, c, cessCount: this.successCount,
    };
  }
}

// Pre-configured circuit breakers for common services
export const rpcCircuitBreaker = new CircuitBreaker('RPC', {
  f, a, i, lureThreshold: 3,
  r, e, c, overyTimeout: 30000, // 30 seconds
  m, o, n, itoringPeriod: 5000,
});

export const jitoCircuitBreaker = new CircuitBreaker('JITO', {
  f, a, i, lureThreshold: 5,
  r, e, c, overyTimeout: 60000, // 60 seconds
  m, o, n, itoringPeriod: 10000,
});

export const databaseCircuitBreaker = new CircuitBreaker('DATABASE', {
  f, a, i, lureThreshold: 3,
  r, e, c, overyTimeout: 15000, // 15 seconds
  m, o, n, itoringPeriod: 5000,
});

// Utility function to wrap any async operation with circuit breaker
export function withCircuitBreaker<T>(
  c, i, r, cuitBreaker: CircuitBreaker,
  o, p, e, ration: () => Promise<T>
): Promise<T> {
  return circuitBreaker.execute(operation);
}

