/**
 * Shared API token validation logic
 * Eliminates duplication across API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/auth/tokens';

export interface TokenValidationResult {
  valid: boolean;
  error?: NextResponse;
}

/**
 * Validate API token with standardized error response
 */
export function validateApiToken(headers: Headers): TokenValidationResult {
  const token = headers.get('x-engine-token');
  
  if (!validateToken(token)) {
    return {
      valid: false,
      error: new NextResponse(
        JSON.stringify({
          error: 'Invalid or missing API token',
          code: 'INVALID_TOKEN',
          timestamp: new Date().toISOString(),
          hint: 'Ensure x-engine-token header is set with a valid token',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'X-Error-Code': 'INVALID_TOKEN',
          },
        }
      ),
    };
  }
  
  return { valid: true };
}

/**
 * Higher-order function to wrap API handlers with token validation
 */
export function withTokenValidation<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    const request = args[0] as NextRequest;
    
    const validation = validateApiToken(request.headers);
    if (!validation.valid && validation.error) {
      return validation.error;
    }
    
    return handler(...args);
  };
}
