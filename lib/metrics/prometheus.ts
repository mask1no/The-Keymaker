import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

// Create a custom registry for Keymaker metrics
export const register = new Registry();

// Collect default Node.js metrics
collectDefaultMetrics({ register });

// Custom application metrics
export const httpRequestDuration = new Histogram({
  name: 'keymaker_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

export const bundleSubmissions = new Counter({
  name: 'keymaker_bundle_submissions_total',
  help: 'Total number of bundle submissions',
  labelNames: ['status', 'mode', 'region'],
  registers: [register],
});

export const bundleSuccessRate = new Gauge({
  name: 'keymaker_bundle_success_rate',
  help: 'Bundle success rate percentage',
  registers: [register],
});

export const activeConnections = new Gauge({
  name: 'keymaker_active_connections',
  help: 'Number of active WebSocket connections',
  registers: [register],
});

export const healthCheckStatus = new Gauge({
  name: 'keymaker_health_check_status',
  help: 'Health check status (1=healthy, 0.5=degraded, 0=down)',
  labelNames: ['service'],
  registers: [register],
});

export const apiTokenValidations = new Counter({
  name: 'keymaker_api_token_validations_total',
  help: 'Total API token validation attempts',
  labelNames: ['status'],
  registers: [register],
});

export const rateLimitHits = new Counter({
  name: 'keymaker_rate_limit_hits_total',
  help: 'Total rate limit hits',
  labelNames: ['identifier_type'],
  registers: [register],
});

export const jitoTipFloor = new Gauge({
  name: 'keymaker_jito_tip_floor_lamports',
  help: 'Current Jito tip floor in lamports',
  labelNames: ['region', 'percentile'],
  registers: [register],
});

export const walletBalance = new Gauge({
  name: 'keymaker_wallet_balance_sol',
  help: 'Wallet balance in SOL',
  labelNames: ['wallet_group', 'wallet_index'],
  registers: [register],
});

/**
 * Record HTTP request metrics
 */
export function recordHttpRequest(
  method: string,
  route: string,
  statusCode: number,
  durationMs: number,
) {
  httpRequestDuration.labels(method, route, statusCode.toString()).observe(durationMs / 1000);
}

/**
 * Record bundle submission
 */
export function recordBundleSubmission(
  status: 'success' | 'failed' | 'timeout',
  mode: 'RPC_FANOUT',
  region?: string,
) {
  bundleSubmissions.labels(status, mode, region || 'unknown').inc();
}

/**
 * Update health check status
 */
export function updateHealthStatus(service: string, status: 'healthy' | 'degraded' | 'down') {
  const value = status === 'healthy' ? 1 : status === 'degraded' ? 0.5 : 0;
  healthCheckStatus.labels(service).set(value);
}

/**
 * Record API token validation
 */
export function recordTokenValidation(status: 'valid' | 'invalid' | 'missing') {
  apiTokenValidations.labels(status).inc();
}

/**
 * Record rate limit hit
 */
export function recordRateLimitHit(identifierType: 'ip' | 'anonymous') {
  rateLimitHits.labels(identifierType).inc();
}

/**
 * Update Jito tip floor metrics
 */
export function updateJitoTipFloor(
  region: string,
  tips50th: number,
  tips75th: number,
  ema: number,
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
