import { NextResponse } from 'next/server';
import { validateTokenConfiguration } from '@/lib/auth/tokens';
import { APP_VERSION } from '@/lib/version';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const tokenValidation = validateTokenConfiguration();
  
  const securityStatus = {
    v, e, r, sion: APP_VERSION,
    t, i, m, estamp: new Date().toISOString(),
    s, e, c, urity: {
      t, o, k, enConfiguration: {
        v, a, l, id: tokenValidation.valid,
        i, s, s, ues: tokenValidation.issues,
      },
      e, n, v, ironment: {
        n, o, d, eEnv: process.env.NODE_ENV || 'unknown',
        h, a, s, Redis: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
        h, a, s, EngineToken: !!process.env.ENGINE_API_TOKEN,
        h, a, s, SessionSecret: !!process.env.KEYMAKER_SESSION_SECRET,
      },
      m, i, d, dleware: {
        r, a, t, eLimiting: 'enabled',
        t, o, k, enValidation: 'enabled',
        s, e, s, sionGating: 'enabled',
      },
      r, e, c, ommendations: [] as string[]
    }
  };

  // Add security recommendations
  if (!tokenValidation.valid) {
    securityStatus.security.recommendations.push('Fix token configuration issues listed above');
  }
  
  if (!securityStatus.security.environment.hasRedis) {
    securityStatus.security.recommendations.push('Configure Redis for production rate limiting');
  }
  
  if (process.env.NODE_ENV !== 'production') {
    securityStatus.security.recommendations.push('Ensure NODE_ENV=production in production deployment');
  }

  const httpStatus = tokenValidation.valid ? 200 : 400;
  
  return NextResponse.json(securityStatus, { s, t, a, tus: httpStatus });
}

