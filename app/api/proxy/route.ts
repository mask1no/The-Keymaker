import { NextRequest, NextResponse } from 'next/server';
import { validatePublicKey, sanitizeString } from '@/lib/validation';
import { spawn } from 'child_process';
import path from 'path';

// Supported API services
const API_SERVICES = {
  birdeye: {
    baseUrl: 'https://public-api.birdeye.so',
    apiKey: process.env.BIRDEYE_API_KEY,
    allowedPaths: ['/token', '/defi/price', '/defi/token_overview'],
  },
  helius: {
    baseUrl: process.env.HELIUS_RPC_URL || 'https://mainnet.helius-rpc.com',
    apiKey: process.env.HELIUS_API_KEY,
    allowedPaths: ['/'],
  },
  jupiter: {
    baseUrl: 'https://quote-api.jup.ag/v6',
    apiKey: process.env.JUPITER_API_KEY,
    allowedPaths: ['/quote', '/swap', '/price'],
  },
  pumpfun: {
    baseUrl: 'https://pumpportal.fun/api',
    apiKey: process.env.PUMPFUN_API_KEY,
    allowedPaths: ['/create', '/add-liquidity', '/token'],
  },
  moonshot: {
    baseUrl: process.env.MOONSHOT_API_URL,
    apiKey: process.env.MOONSHOT_API_KEY,
    allowedPaths: ['/create', '/token'],
  },
} as const;

// Rate limiting map (in-memory for now, use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration
const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
};

/**
 * Check rate limit for IP
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);
  
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowMs,
    });
    return true;
  }
  
  if (limit.count >= RATE_LIMIT.maxRequests) {
    return false;
  }
  
  limit.count++;
  return true;
}

/**
 * Validate request parameters
 */
function validateRequest(
  service: string,
  path: string,
  params: any
): { valid: boolean; error?: string } {
  // Check if service exists
  if (!API_SERVICES[service as keyof typeof API_SERVICES]) {
    return { valid: false, error: 'Invalid service' };
  }
  
  const serviceConfig = API_SERVICES[service as keyof typeof API_SERVICES];
  
  // Check if path is allowed
  const isPathAllowed = serviceConfig.allowedPaths.some(allowedPath => 
    path.startsWith(allowedPath)
  );
  
  if (!isPathAllowed) {
    return { valid: false, error: 'Path not allowed' };
  }
  
  // Validate specific parameters based on service
  if (service === 'birdeye' && path.includes('/token/')) {
    const tokenAddress = path.split('/token/')[1];
    const validation = validatePublicKey(tokenAddress);
    if (!validation.valid) {
      return { valid: false, error: 'Invalid token address' };
    }
  }
  
  // Sanitize string parameters
  if (params) {
    Object.keys(params).forEach(key => {
      if (typeof params[key] === 'string') {
        params[key] = sanitizeString(params[key], 200);
      }
    });
  }
  
  return { valid: true };
}

/**
 * Execute Python MCP command
 */
async function executePythonMCP(method: string, params: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const mcpPath = path.join(process.cwd(), 'bonk-mcp');
    const pythonProcess = spawn('python', [
      path.join(mcpPath, 'src', 'bonk_mcp', 'cli_wrapper.py'),
      '--method', method,
      '--params', JSON.stringify(params)
    ], {
      cwd: mcpPath,
      env: {
        ...process.env,
        KEYPAIR: params.keypair || process.env.SOLANA_KEYPAIR,
        RPC_URL: process.env.HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com'
      }
    });

    let output = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(error || 'Python process failed'));
      } else {
        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (e) {
          reject(new Error('Failed to parse Python output'));
        }
      }
    });
  });
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { service, path, params, method = 'GET' } = body;
    
    // Handle Python MCP calls
    if (body.method && ['launch-token', 'buy-token'].includes(body.method)) {
      try {
        const result = await executePythonMCP(body.method, body.params);
        return NextResponse.json(result);
      } catch (error) {
        return NextResponse.json(
          { error: (error as Error).message, success: false },
          { status: 500 }
        );
      }
    }
    
    // Validate request
    const validation = validateRequest(service, path, params);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    
    // Get service configuration
    const serviceConfig = API_SERVICES[service as keyof typeof API_SERVICES];
    if (!serviceConfig.baseUrl) {
      return NextResponse.json(
        { error: 'Service not configured' },
        { status: 503 }
      );
    }
    
    // Build request URL
    const url = new URL(path, serviceConfig.baseUrl);
    
    // Add query parameters for GET requests
    if (method === 'GET' && params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }
    
    // Build headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Add API key based on service
    if (serviceConfig.apiKey) {
      if (service === 'birdeye') {
        headers['X-API-KEY'] = serviceConfig.apiKey;
      } else if (service === 'helius' && url.pathname === '/') {
        // Helius uses query param
        url.searchParams.append('api-key', serviceConfig.apiKey);
      } else {
        headers['Authorization'] = `Bearer ${serviceConfig.apiKey}`;
      }
    }
    
    // Make the proxied request
    const response = await fetch(url.toString(), {
      method,
      headers,
      body: method !== 'GET' ? JSON.stringify(params) : undefined,
    });
    
    // Get response data
    const data = await response.json();
    
    // Log suspicious activity
    if (!response.ok) {
      console.error(`API proxy error: ${service}${path}`, {
        status: response.status,
        error: data,
        ip,
      });
    }
    
    // Return proxied response
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'X-RateLimit-Remaining': String(
          RATE_LIMIT.maxRequests - (rateLimitMap.get(ip)?.count || 0)
        ),
      },
    });
    
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
} 