import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// In-memory fallback for development
const cache = new Map<string, { count: number; resetTime: number }>();

// Redis-based rate limiter for production
let rateLimiter: Ratelimit | null = null;

// Initialize Redis rate limiter - MANDATORY in production
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    rateLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "10 s"), // 10 requests per 10 seconds
      analytics: true,
      prefix: "keymaker_ratelimit",
    });
  } catch (error) {
    console.error('Failed to initialize Redis rate limiter:', error);
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Redis rate limiter is required in production');
    }
    console.warn('Falling back to in-memory rate limiting (development only)');
  }
} else if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
  // Only enforce Redis in production runtime, not during build
  console.warn('Redis not configured - will be required at runtime in production');
}

/**
 * Rate limit check for API endpoints
 */
export async function checkRateLimit(identifier: string): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
}> {
  // In production, Redis is mandatory
  if (process.env.NODE_ENV === 'production' && !rateLimiter) {
    throw new Error('Redis is required for rate limiting in production');
  }
  // Use Redis rate limiter if available
  if (rateLimiter) {
    try {
      const result = await rateLimiter.limit(identifier);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: new Date(result.reset),
        retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
      };
    } catch (error) {
      console.error('Redis rate limiter error:', error);
      // Fall through to in-memory limiter
    }
  }

  // In-memory fallback rate limiter
  return checkInMemoryRateLimit(identifier);
}

/**
 * In-memory rate limiter for development/fallback
 */
function checkInMemoryRateLimit(identifier: string): {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
} {
  const now = Date.now();
  const windowMs = 10 * 1000; // 10 seconds
  const limit = 10; // 10 requests per window

  const existing = cache.get(identifier);
  
  if (!existing || now >= existing.resetTime) {
    // New window
    const resetTime = now + windowMs;
    cache.set(identifier, { count: 1, resetTime });
    
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: new Date(resetTime),
    };
  }

  if (existing.count >= limit) {
    // Rate limited
    return {
      success: false,
      limit,
      remaining: 0,
      reset: new Date(existing.resetTime),
      retryAfter: Math.ceil((existing.resetTime - now) / 1000),
    };
  }

  // Within limit
  existing.count++;
  cache.set(identifier, existing);

  return {
    success: true,
    limit,
    remaining: limit - existing.count,
    reset: new Date(existing.resetTime),
  };
}

/**
 * Get rate limit identifier from request
 */
export function getRateLimitIdentifier(request: Request): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  const ip = forwarded?.split(',')[0]?.trim() || realIp || cfConnectingIp || 'anonymous';
  
  // Include user agent for better fingerprinting
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const userAgentHash = Buffer.from(userAgent).toString('base64').slice(0, 8);
  
  return `${ip}:${userAgentHash}`;
}

/**
 * Rate limit middleware for API routes
 */
export async function rateLimit(request: Request): Promise<Response | null> {
  const identifier = getRateLimitIdentifier(request);
  const result = await checkRateLimit(identifier);

  if (!result.success) {
    return new Response('Too Many Requests', {
      status: 429,
      headers: {
        'Content-Type': 'text/plain',
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toISOString(),
        'Retry-After': result.retryAfter?.toString() || '10',
        'X-Error-Code': 'RATE_LIMITED',
      },
    });
  }

  // Add rate limit headers to successful responses
  return null; // Continue processing
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(response: Response, result: {
  limit: number;
  remaining: number;
  reset: Date;
}): Response {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.reset.toISOString());
  
  return response;
}
