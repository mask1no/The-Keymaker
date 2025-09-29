/**
 * Production startup validation - fail fast on misconfiguration
 */

export function validateProductionStartup(): void {
  if (process.env.NODE_ENV !== 'production') {
    return; // Skip validation in development
  }

  const errors: string[] = [];

  // ENGINE_API_TOKEN validation
  const engineToken = process.env.ENGINE_API_TOKEN;
  if (!engineToken || engineToken.trim() === '') {
    errors.push('ENGINE_API_TOKEN is required and cannot be empty in production');
  } else if (engineToken.length < 32) {
    errors.push('ENGINE_API_TOKEN must be at least 32 characters in production');
  } else if (engineToken.includes('generate') || engineToken.includes('placeholder')) {
    errors.push('ENGINE_API_TOKEN appears to be a placeholder value');
  }

  // Session secret validation
  const sessionSecret = process.env.KEYMAKER_SESSION_SECRET;
  if (!sessionSecret || sessionSecret.trim() === '') {
    errors.push('KEYMAKER_SESSION_SECRET is required and cannot be empty in production');
  } else if (sessionSecret.length < 32) {
    errors.push('KEYMAKER_SESSION_SECRET must be at least 32 characters in production');
  }

  // Redis validation (if rate limiting is used)
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!redisUrl || !redisToken) {
    errors.push('Redis configuration (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN) is required in production for rate limiting');
  }

  // RPC configuration
  if (!process.env.HELIUS_RPC_URL && !process.env.PUBLIC_RPC_URL) {
    errors.push('At least one RPC endpoint (HELIUS_RPC_URL or PUBLIC_RPC_URL) is required');
  }

  // Keypair configuration
  if (!process.env.KEYPAIR_JSON) {
    errors.push('KEYPAIR_JSON is required for transaction signing');
  }

  if (errors.length > 0) {
    console.error('❌ PRODUCTION STARTUP VALIDATION FAILED:');
    errors.forEach(error => console.error(`  • ${error}`));
    console.error('\n💡 Fix these configuration issues before deploying to production.');
    throw new Error(`Production validation failed: ${errors.length} configuration errors`);
  }

  console.log('✅ Production startup validation passed');
}

// Auto-validate on module load in production (server-side only)
if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
  validateProductionStartup();
}

export default validateProductionStartup;
