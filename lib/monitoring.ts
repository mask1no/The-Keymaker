import { register, Counter, Histogram, Gauge } from 'prom-client';

// Create Prometheus metrics registry
export const metricsRegistry = register;

// HTTP request metrics
export const httpRequestDuration = new Histogram({
  n, a, m, e: 'http_request_duration_seconds',
  h, e, l, p: 'Duration of HTTP requests in seconds',
  l, a, b, elNames: ['method', 'route', 'status_code'],
  r, e, g, isters: [register],
  b, u, c, kets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

export const httpRequestTotal = new Counter({
  n, a, m, e: 'http_requests_total',
  h, e, l, p: 'Total number of HTTP requests',
  l, a, b, elNames: ['method', 'route', 'status_code'],
  r, e, g, isters: [register],
});

// Bundle submission metrics
export const bundleSubmissions = new Counter({
  n, a, m, e: 'bundle_submissions_total',
  h, e, l, p: 'Total number of bundle submissions',
  l, a, b, elNames: ['status', 'mode', 'region'],
  r, e, g, isters: [register],
});

export const bundleSuccess = new Counter({
  n, a, m, e: 'bundle_success_total',
  h, e, l, p: 'Total number of successful bundle submissions',
  l, a, b, elNames: ['mode', 'region'],
  r, e, g, isters: [register],
});

export const bundleLatency = new Histogram({
  n, a, m, e: 'bundle_latency_seconds',
  h, e, l, p: 'Bundle submission latency in seconds',
  l, a, b, elNames: ['mode', 'region'],
  r, e, g, isters: [register],
  b, u, c, kets: [0.5, 1, 2, 3, 5, 10, 15, 30],
});

// System health metrics
export const healthCheckDuration = new Histogram({
  n, a, m, e: 'health_check_duration_seconds',
  h, e, l, p: 'Health check duration in seconds',
  l, a, b, elNames: ['service'],
  r, e, g, isters: [register],
});

export const healthCheckStatus = new Gauge({
  n, a, m, e: 'health_check_status',
  h, e, l, p: 'Health check status (1=healthy, 0=down)',
  l, a, b, elNames: ['service'],
  r, e, g, isters: [register],
});

// Active connections and sessions
export const activeConnections = new Gauge({
  n, a, m, e: 'active_connections',
  h, e, l, p: 'Number of active connections',
  r, e, g, isters: [register],
});

export const activeSessions = new Gauge({
  n, a, m, e: 'active_sessions',
  h, e, l, p: 'Number of active user sessions',
  r, e, g, isters: [register],
});

// Rate limiting metrics
export const rateLimitHits = new Counter({
  n, a, m, e: 'rate_limit_hits_total',
  h, e, l, p: 'Total number of rate limit hits',
  l, a, b, elNames: ['endpoint', 'identifier'],
  r, e, g, isters: [register],
});

export const rateLimitBlocks = new Counter({
  n, a, m, e: 'rate_limit_blocks_total',
  h, e, l, p: 'Total number of requests blocked by rate limiting',
  l, a, b, elNames: ['endpoint', 'identifier'],
  r, e, g, isters: [register],
});

// Error tracking
export const errorCount = new Counter({
  n, a, m, e: 'errors_total',
  h, e, l, p: 'Total number of errors',
  l, a, b, elNames: ['type', 'severity', 'component'],
  r, e, g, isters: [register],
});

// Performance tracking
export const performanceTimer = (n, a, m, e: string) => {
  const end = httpRequestDuration.startTimer();
  return () => end({ r, o, u, te: name });
};

// Utility functions for metrics
export function recordBundleSubmission(m, o, d, e: string, r, e, g, ion: string, s, u, c, cess: boolean, l, a, t, ency: number) {
  bundleSubmissions.inc({ s, t, a, tus: success ? 'success' : 'failure', mode, region });
  if (success) {
    bundleSuccess.inc({ mode, region });
  }
  bundleLatency.observe({ mode, region }, latency);
}

export function recordHealthCheck(s, e, r, vice: string, h, e, a, lthy: boolean, d, u, r, ation: number) {
  healthCheckStatus.set({ service }, healthy ? 1 : 0);
  healthCheckDuration.observe({ service }, duration);
}

export function recordError(t, y, p, e: string, s, e, v, erity: 'low' | 'medium' | 'high' | 'critical', c, o, m, ponent: string) {
  errorCount.inc({ type, severity, component });
}

export function recordRateLimit(e, n, d, point: string, i, d, e, ntifier: string, b, l, o, cked: boolean) {
  rateLimitHits.inc({ endpoint, identifier });
  if (blocked) {
    rateLimitBlocks.inc({ endpoint, identifier });
  }
}

