import { register, Counter, Histogram, Gauge } from 'prom-client';

// Create Prometheus metrics registry
export const metricsRegistry = register;

// HTTP request metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Bundle submission metrics
export const bundleSubmissions = new Counter({
  name: 'bundle_submissions_total',
  help: 'Total number of bundle submissions',
  labelNames: ['status', 'mode', 'region'],
  registers: [register],
});

export const bundleSuccess = new Counter({
  name: 'bundle_success_total',
  help: 'Total number of successful bundle submissions',
  labelNames: ['mode', 'region'],
  registers: [register],
});

export const bundleLatency = new Histogram({
  name: 'bundle_latency_seconds',
  help: 'Bundle submission latency in seconds',
  labelNames: ['mode', 'region'],
  registers: [register],
  buckets: [0.5, 1, 2, 3, 5, 10, 15, 30],
});

// System health metrics
export const healthCheckDuration = new Histogram({
  name: 'health_check_duration_seconds',
  help: 'Health check duration in seconds',
  labelNames: ['service'],
  registers: [register],
});

export const healthCheckStatus = new Gauge({
  name: 'health_check_status',
  help: 'Health check status (1=healthy, 0=down)',
  labelNames: ['service'],
  registers: [register],
});

// Active connections and sessions
export const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  registers: [register],
});

export const activeSessions = new Gauge({
  name: 'active_sessions',
  help: 'Number of active user sessions',
  registers: [register],
});

// Rate limiting metrics
export const rateLimitHits = new Counter({
  name: 'rate_limit_hits_total',
  help: 'Total number of rate limit hits',
  labelNames: ['endpoint', 'identifier'],
  registers: [register],
});

export const rateLimitBlocks = new Counter({
  name: 'rate_limit_blocks_total',
  help: 'Total number of requests blocked by rate limiting',
  labelNames: ['endpoint', 'identifier'],
  registers: [register],
});

// Error tracking
export const errorCount = new Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'severity', 'component'],
  registers: [register],
});

// Performance tracking
export const performanceTimer = (name: string) => {
  const end = httpRequestDuration.startTimer();
  return () => end({ route: name });
};

// Utility functions for metrics
export function recordBundleSubmission(
  mode: string,
  region: string,
  success: boolean,
  latency: number,
) {
  bundleSubmissions.inc({ status: success ? 'success' : 'failure', mode, region });
  if (success) {
    bundleSuccess.inc({ mode, region });
  }
  bundleLatency.observe({ mode, region }, latency);
}

export function recordHealthCheck(service: string, healthy: boolean, duration: number) {
  healthCheckStatus.set({ service }, healthy ? 1 : 0);
  healthCheckDuration.observe({ service }, duration);
}

export function recordError(
  type: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  component: string,
) {
  errorCount.inc({ type, severity, component });
}

export function recordRateLimit(endpoint: string, identifier: string, blocked: boolean) {
  rateLimitHits.inc({ endpoint, identifier });
  if (blocked) {
    rateLimitBlocks.inc({ endpoint, identifier });
  }
}
