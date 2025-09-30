import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/auth/tokens';

/**
 * Standard API error response format
 */
export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, any>;
  timestamp: string;
}

/**
 * Create standardized API error response
 */
export function createApiError(
  message: string,
  status = 500,
  code?: string,
  details?: Record<string, any>
): NextResponse {
  const error: ApiError = {
    error: message,
    timestamp: new Date().toISOString(),
  };
  
  if (code) error.code = code;
  if (details) error.details = details;
  
  return NextResponse.json(error, { status });
}

/**
 * Validate API token for protected endpoints
 */
export function requireApiToken(headers: Headers): NextResponse | null {
  const token = headers.get('x-engine-token');
  
  if (!validateToken(token)) {
    return createApiError(
      'Invalid or missing API token',
      401,
      'INVALID_TOKEN',
      {
        hint: 'Ensure x-engine-token header is set with a valid token',
        required: true,
      }
    );
  }
  
  return null; // No error, continue processing
}

/**
 * Validate request body size
 */
export function validateRequestSize(
  request: NextRequest,
  maxSizeKB = 8
): NextResponse | null {
  const contentLength = request.headers.get('content-length');
  
  if (contentLength) {
    const sizeKB = parseInt(contentLength) / 1024;
    if (sizeKB > maxSizeKB) {
      return createApiError(
        `Request body too large (${sizeKB.toFixed(1)}KB > ${maxSizeKB}KB)`,
        413,
        'PAYLOAD_TOO_LARGE',
        {
          maxSizeKB,
          actualSizeKB: Math.round(sizeKB * 10) / 10,
        }
      );
    }
  }
  
  return null;
}

/**
 * Parse and validate JSON request body
 */
export async function parseJsonBody<T = any>(
  request: NextRequest
): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const body = await request.text();
    
    if (!body.trim()) {
      return {
        error: createApiError(
          'Request body is empty',
          400,
          'EMPTY_BODY'
        )
      };
    }
    
    const data = JSON.parse(body) as T;
    return { data };
  } catch (error) {
    return {
      error: createApiError(
        'Invalid JSON in request body',
        400,
        'INVALID_JSON',
        {
          hint: 'Ensure request body contains valid JSON',
        }
      )
    };
  }
}

/**
 * Combined middleware for protected API endpoints
 */
export async function protectedApiHandler(
  request: NextRequest,
  options: {
    requireToken?: boolean;
    maxSizeKB?: number;
    parseJson?: boolean;
  } = {}
): Promise<
  | { error: NextResponse }
  | { data?: any; continue: true }
> {
  const {
    requireToken = true,
    maxSizeKB = 8,
    parseJson = false,
  } = options;
  
  // Validate request size
  const sizeError = validateRequestSize(request, maxSizeKB);
  if (sizeError) return { error: sizeError };
  
  // Validate API token if required
  if (requireToken) {
    const tokenError = requireApiToken(request.headers);
    if (tokenError) return { error: tokenError };
  }
  
  // Parse JSON body if requested
  if (parseJson) {
    const result = await parseJsonBody(request);
    if ('error' in result) return { error: result.error };
    return { data: result.data, continue: true };
  }
  
  return { continue: true };
}

/**
 * Wrap API handler with standard middleware
 */
export function withApiMiddleware<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>,
  options?: Parameters<typeof protectedApiHandler>[1]
) {
  return async (...args: T): Promise<NextResponse> => {
    const request = args[0] as NextRequest;
    
    const result = await protectedApiHandler(request, options);
    if ('error' in result) return result.error;
    
    // Add data to request if parsed
    if ('data' in result && result.data) {
      (request as any).parsedBody = result.data;
    }
    
    return handler(...args);
  };
}
