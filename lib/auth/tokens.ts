import crypto from 'crypto';

/**
 * Generate a cryptographically secure API token
 */
export function generateApiToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate API token with constant-time comparison
 */
export function validateToken(token: string | null | undefined): boolean {
  const expectedToken = process.env.ENGINE_API_TOKEN;
  
  // Reject if no token provided or no expected token configured
  if (!token || !expectedToken) {
    return false;
  }
  
  // Reject tokens that are too short (minimum 32 chars)
  if (token.length < 32 || expectedToken.length < 32) {
    return false;
  }
  
  // Constant-time comparison to prevent timing attacks
  return constantTimeCompare(token, expectedToken);
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Generate a secure session secret
 */
export function generateSessionSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate that environment tokens are properly configured
 */
export function validateTokenConfiguration(): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  const engineToken = process.env.ENGINE_API_TOKEN;
  const sessionSecret = process.env.KEYMAKER_SESSION_SECRET;
  
  if (!engineToken) {
    issues.push('ENGINE_API_TOKEN not configured');
  } else if (engineToken.length < 32) {
    issues.push('ENGINE_API_TOKEN too short (minimum 32 characters)');
  } else if (engineToken.includes('generate-a-real-token-here')) {
    issues.push('ENGINE_API_TOKEN is still using placeholder value');
  }
  
  if (!sessionSecret) {
    issues.push('KEYMAKER_SESSION_SECRET not configured');
  } else if (sessionSecret.length < 32) {
    issues.push('KEYMAKER_SESSION_SECRET too short (minimum 32 characters)');
  } else if (sessionSecret.includes('generate-32-char-secret')) {
    issues.push('KEYMAKER_SESSION_SECRET is still using placeholder value');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}
