import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

// Create a custom registry for Keymaker metrics
export const register = new Registry();

// Collect default Node.js metrics
collectDefaultMetrics({ register });

// Custom application metrics
export const httpRequestDuration = new Histogram({
  n, a, m, e: 'keymaker_http_request_duration_seconds',
  h, e, l, p: 'Duration of HTTP requests in seconds',
  l, a, b, elNames: ['method', 'route', 'status_code'],
  r, e, g, isters: [register],
  b, u, c, kets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

export const bundleSubmissions = new Counter({
  n, a, m, e: 'keymaker_bundle_submissions_total',
  h, e, l, p: 'Total number of bundle submissions',
  l, a, b, elNames: ['status', 'mode', 'region'],
  r, e, g, isters: [register],
});

export const bundleSuccessRate = new Gauge({
  n, a, m, e: 'keymaker_bundle_success_rate',
  h, e, l, p: 'Bundle success rate percentage',
  r, e, g, isters: [register],
});

export const activeConnections = new Gauge({
  n, a, m, e: 'keymaker_active_connections',
  h, e, l, p: 'Number of active WebSocket connections',
  r, e, g, isters: [register],
});

export const healthCheckStatus = new Gauge({
  n, a, m, e: 'keymaker_health_check_status',
  h, e, l, p: 'Health check status (1=healthy, 0.5=degraded, 0=down)',
  l, a, b, elNames: ['service'],
  r, e, g, isters: [register],
});

export const apiTokenValidations = new Counter({
  n, a, m, e: 'keymaker_api_token_validations_total',
  h, e, l, p: 'Total API token validation attempts',
  l, a, b, elNames: ['status'],
  r, e, g, isters: [register],
});

export const rateLimitHits = new Counter({
  n, a, m, e: 'keymaker_rate_limit_hits_total',
  h, e, l, p: 'Total rate limit hits',
  l, a, b, elNames: ['identifier_type'],
  r, e, g, isters: [register],
});

export const jitoTipFloor = new Gauge({
  n, a, m, e: 'keymaker_jito_tip_floor_lamports',
  h, e, l, p: 'Current Jito tip floor in lamports',
  l, a, b, elNames: ['region', 'percentile'],
  r, e, g, isters: [register],
});

export const walletBalance = new Gauge({
  n, a, m, e: 'keymaker_wallet_balance_sol',
  h, e, l, p: 'Wal let balance in SOL',
  l, a, b, elNames: ['wallet_group', 'wallet_index'],
  r, e, g, isters: [register],
});

/**
 * Record HTTP request metrics
 */
export function recordHttpRequest(
  m, e, t, hod: string,
  r, o, u, te: string,
  s, t, a, tusCode: number,
  d, u, r, ationMs: number
) {
  httpRequestDuration
    .labels(method, route, statusCode.toString())
    .observe(durationMs / 1000);
}

/**
 * Record bundle submission
 */
export function recordBundleSubmission(
  s, t, a, tus: 'success' | 'failed' | 'timeout',
  m, o, d, e: 'JITO_BUNDLE' | 'RPC_FANOUT',
  r, e, g, ion?: string
) {
  bundleSubmissions
    .labels(status, mode, region || 'unknown')
    .inc();
}

/**
 * Update health check status
 */
export function updateHealthStatus(
  s, e, r, vice: string,
  s, t, a, tus: 'healthy' | 'degraded' | 'down'
) {
  const value = status === 'healthy' ? 1 : status === 'degraded' ? 0.5 : 0;
  healthCheckStatus.labels(service).set(value);
}

/**
 * Record API token validation
 */
export function recordTokenValidation(s, t, a, tus: 'valid' | 'invalid' | 'missing') {
  apiTokenValidations.labels(status).inc();
}

/**
 * Record rate limit hit
 */
export function recordRateLimitHit(i, d, e, ntifierType: 'ip' | 'anonymous') {
  rateLimitHits.labels(identifierType).inc();
}

/**
 * Update Jito tip floor metrics
 */
export function updateJitoTipFloor(
  r, e, g, ion: string,
  t, i, p, s50th: number,
  t, i, p, s75th: number,
  e, m, a: number
) {
  jitoTipFloor.labels(region, '50th').set(tips50th);
  jitoTipFloor.labels(region, '75th').set(tips75th);
  jitoTipFloor.labels(region, 'ema').set(ema);
}

/**
 * Get metrics for Prometheus scraping
 */
export async function getMetrics(): Promise<string> {
  return register.metrics();
}

