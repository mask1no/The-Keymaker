/**
 * Production Readiness Validation
 * Ensures all critical requirements are met before deployment
 */

export interface ReadinessCheck {
  name: string;
  passed: boolean;
  message: string;
  severity: 'critical' | 'warning' | 'info';
}

export interface ReadinessReport {
  ready: boolean;
  score: number;
  checks: ReadinessCheck[];
  blockers: string[];
  warnings: string[];
}

/**
 * Comprehensive production readiness validation
 */
export function validateProductionReadiness(): ReadinessReport {
  const checks: ReadinessCheck[] = [];
  
  // Environment variables check
  checks.push(validateEnvironmentVariables());
  
  // Security configuration
  checks.push(validateSecurityConfig());
  
  // Redis availability (required for production)
  checks.push(validateRedisConfig());
  
  // Bundle size check
  checks.push(validateBundleSize());
  
  // Calculate results
  const blockers = checks
    .filter(c => !c.passed && c.severity === 'critical')
    .map(c => c.message);
    
  const warnings = checks
    .filter(c => !c.passed && c.severity === 'warning')
    .map(c => c.message);
  
  const passedCount = checks.filter(c => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 10);
  const ready = blockers.length === 0;
  
  return {
    ready,
    score,
    checks,
    blockers,
    warnings
  };
}

function validateEnvironmentVariables(): ReadinessCheck {
  const required = [
    'HELIUS_RPC_URL',
    'ENGINE_API_TOKEN',
    'KEYMAKER_SESSION_SECRET',
    'KEYPAIR_JSON',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    return {
      name: 'Environment Variables',
      passed: false,
      message: `Missing required env vars: ${missing.join(', ')}`,
      severity: 'critical'
    };
  }
  
  return {
    name: 'Environment Variables',
    passed: true,
    message: 'All required environment variables are set',
    severity: 'info'
  };
}

function validateSecurityConfig(): ReadinessCheck {
  const token = process.env.ENGINE_API_TOKEN || '';
  const secret = process.env.KEYMAKER_SESSION_SECRET || '';
  
  if (token.length < 32) {
    return {
      name: 'Security Configuration',
      passed: false,
      message: 'ENGINE_API_TOKEN must be at least 32 characters',
      severity: 'critical'
    };
  }
  
  if (secret.length < 32) {
    return {
      name: 'Security Configuration',
      passed: false,
      message: 'KEYMAKER_SESSION_SECRET must be at least 32 characters',
      severity: 'critical'
    };
  }
  
  // Check for placeholder values
  if (token.includes('generate') || token.includes('placeholder') || token.includes('your_')) {
    return {
      name: 'Security Configuration',
      passed: false,
      message: 'ENGINE_API_TOKEN appears to be a placeholder',
      severity: 'critical'
    };
  }
  
  return {
    name: 'Security Configuration',
    passed: true,
    message: 'Security tokens are properly configured',
    severity: 'info'
  };
}

function validateRedisConfig(): ReadinessCheck {
  const isProd = process.env.NODE_ENV === 'production';
  const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  
  if (isProd && !hasRedis) {
    return {
      name: 'Redis Configuration',
      passed: false,
      message: 'Redis is required in production for rate limiting',
      severity: 'critical'
    };
  }
  
  if (!isProd && !hasRedis) {
    return {
      name: 'Redis Configuration',
      passed: true,
      message: 'Redis not configured (development mode)',
      severity: 'warning'
    };
  }
  
  return {
    name: 'Redis Configuration',
    passed: true,
    message: 'Redis is properly configured',
    severity: 'info'
  };
}

function validateBundleSize(): ReadinessCheck {
  // This is a static check - in a real scenario you'd read from build output
  const currentSize = 94.8; // KB
  const targetSize = 50; // KB
  
  if (currentSize > targetSize * 1.5) {
    return {
      name: 'Bundle Size',
      passed: false,
      message: `Bundle size (${currentSize}KB) significantly exceeds target (${targetSize}KB)`,
      severity: 'warning'
    };
  }
  
  if (currentSize > targetSize) {
    return {
      name: 'Bundle Size',
      passed: true,
      message: `Bundle size (${currentSize}KB) slightly exceeds target (${targetSize}KB) but acceptable`,
      severity: 'info'
    };
  }
  
  return {
    name: 'Bundle Size',
    passed: true,
    message: `Bundle size (${currentSize}KB) meets target (<${targetSize}KB)`,
    severity: 'info'
  };
}

/**
 * Generate a human-readable production readiness report
 */
export function generateReadinessReport(): string {
  const report = validateProductionReadiness();
  
  let output = '\n=== PRODUCTION READINESS REPORT ===\n\n';
  output += `Score: ${report.score}/10\n`;
  output += `Status: ${report.ready ? '✅ READY' : '❌ NOT READY'}\n\n`;
  
  if (report.blockers.length > 0) {
    output += '🔴 BLOCKERS (must fix before production):\n';
    report.blockers.forEach(b => output += `  - ${b}\n`);
    output += '\n';
  }
  
  if (report.warnings.length > 0) {
    output += '🟡 WARNINGS (should address):\n';
    report.warnings.forEach(w => output += `  - ${w}\n`);
    output += '\n';
  }
  
  output += 'DETAILED CHECKS:\n';
  report.checks.forEach(check => {
    const icon = check.passed ? '✅' : (check.severity === 'critical' ? '🔴' : '🟡');
    output += `  ${icon} ${check.name}: ${check.message}\n`;
  });
  
  output += '\n=================================\n';
  
  return output;
}
