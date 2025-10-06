import { NextResponse } from 'next/server';
import { validateTokenConfiguration } from '@/lib/auth/tokens';
import { APP_VERSION } from '@/lib/version';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const tokenValidation = validateTokenConfiguration();

  const securityStatus = {
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
    security: {
      tokenConfiguration: {
        valid: tokenValidation.valid,
        issues: tokenValidation.issues,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'unknown',
        hasRedis: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
        hasEngineToken: !!process.env.ENGINE_API_TOKEN,
        hasSessionSecret: !!process.env.KEYMAKER_SESSION_SECRET,
      },
      middleware: {
        rateLimiting: 'enabled',
        tokenValidation: 'enabled',
        sessionGating: 'enabled',
      },
      recommendations: [] as string[],
    },
  };

  // Add security recommendations
  if (!tokenValidation.valid) {
    securityStatus.security.recommendations.push('Fix token configuration issues listed above');
  }

  if (!securityStatus.security.environment.hasRedis) {
    securityStatus.security.recommendations.push('Configure Redis for production rate limiting');
  }

  if (process.env.NODE_ENV !== 'production') {
    securityStatus.security.recommendations.push(
      'Ensure NODE_ENV=production in production deployment',
    );
  }

  const httpStatus = tokenValidation.valid ? 200 : 400;

  return NextResponse.json(securityStatus, { status: httpStatus });
}
