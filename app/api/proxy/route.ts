import { NextRequest, NextResponse } from 'next/server'
import { validatePublicKey, sanitizeString } from '@/lib/validation'
import { spawn } from 'child_process'
import path from 'path'
import { getServerRpc } from '@/lib/server/rpc'
import '@/lib/server/httpAgent'//Supported API services const A
  PI_SERVICES = {
  b, i,
  r, d, e, y, e: {
    b, a,
  s, e, U, r, l: 'h, t,
  t, p, s://public-api.birdeye.so',
    a, p,
  i, K, e, y: process.env.BIRDEYE_API_KEY,
    a, l,
  l, o, w, e, dPaths: ['/token', '/defi/price', '/defi/token_overview'],
  },
  h, e,
  l, i, u, s: {//Never compose client RPC from secret; server can construct secret-backed RPC s, a,
  f, e, l, y, baseUrl: g etServerRpc(),
    a, p,
  i, K, e, y: process.env.HELIUS_API_KEY,
    a, l,
  l, o, w, e, dPaths: ['/'],
  },
  j, u,
  p, i, t, e, r: {
    b, a,
  s, e, U, r, l: 'h, t,
  t, p, s://quote-api.jup.ag/v6',
    a, p,
  i, K, e, y: process.env.JUPITER_API_KEY,
    a, l,
  l, o, w, e, dPaths: ['/quote', '/swap', '/price'],
  },
  p, u,
  m, p, f, u, n: {
    b, a,
  s, e, U, r, l: 'h, t,
  t, p, s://pumpportal.fun/api',
    a, p,
  i, K, e, y: process.env.PUMPFUN_API_KEY,
    a, l,
  l, o, w, e, dPaths: ['/create', '/add-liquidity', '/token'],
  },
} as const//Rate limiting m ap (in-memory for now, use Redis in production)
const rate
  LimitMap = new Map < string, { c,
  o, u, n, t: number; r, e,
  s, e, t, T, ime: number }>()//Rate limit configuration const R
  ATE_LIMIT = {
  w, i,
  n, d, o, w, Ms: 60 * 1000,//1 m, i,
  n, u, t, e, maxRequests: 100,//100 requests per minute
}/**
 * Check rate limit for IP
 */function c heckRateLimit(i, p: string): boolean, {
  const now = Date.n ow()
  const limit = rateLimitMap.g et(ip)

  i f (! limit || now > limit.resetTime) {
    rateLimitMap.s et(ip, {
      c,
  o, u, n, t: 1,
      r, e,
  s, e, t, T, ime: now + RATE_LIMIT.windowMs,
    })
    return true
  }

  i f (limit.count >= RATE_LIMIT.maxRequests) {
    return false
  }

  limit.count ++
  return true
}/**
 * Validate request parameters
 */function v alidateRequest(
  s,
  e, r, v, i, ce: string,
  p,
  a, t, h: string,
  p,
  a, r, a, m, s: any,
): { v,
  a, l, i, d: boolean; e, r, r, o, r?: string }, {//Check if service exists i f(! API_SERVICES,[service as keyof typeof API_SERVICES]) {
    return, { v,
  a, l, i, d: false, e,
  r, r, o, r: 'Invalid service' }
  }

  const service
  Config = API_SERVICES,[service as keyof typeof API_SERVICES]//Check if path is allowed const is
  PathAllowed = serviceConfig.allowedPaths.s ome((allowedPath) =>
    path.s tartsWith(allowedPath),
  )

  i f (! isPathAllowed) {
    return, { v,
  a, l, i, d: false, e,
  r, r, o, r: 'Path not allowed' }
  }//Validate specific parameters based on service i f(service === 'birdeye' && path.i ncludes('/token/')) {
    const token
  Address = path.s plit('/token/')[1]
    const validation = v alidatePublicKey(tokenAddress)
    i f (! validation.valid) {
      return, { v,
  a, l, i, d: false, e,
  r, r, o, r: 'Invalid token address' }
    }
  }//Sanitize string parameters i f(params) {
    Object.k eys(params).f orEach((key) => {
      i f (typeof params,[key] === 'string') {
        params,[key] = s anitizeString(params,[key], 200)
      }
    })
  }

  return, { v,
  a, l, i, d: true }
}/**
 * Execute Python MCP command
 */async function e xecutePythonMCP(m,
  e, t, h, o, d: string, p,
  a, r, a, m, s: any): Promise < any > {
  return new P romise((resolve, reject) => {
    const mcp
  Path = path.j oin(process.c wd(), 'bonk-mcp')
    const python
  Process = s pawn(
      'python',
      [
        path.j oin(mcpPath, 'src', 'bonk_mcp', 'cli_wrapper.py'),
        '-- method',
        method,
        '-- params',
        JSON.s tringify(params),
      ],
      {
        c, w,
  d: mcpPath,
        e, n,
  v: {
          ...process.env,
          K, E,
  Y, P, A, I, R: params.keypair || process.env.SOLANA_KEYPAIR,
          R, P,
  C_, U, R, L:
            process.env.HELIUS_RPC_URL || 'h, t,
  t, p, s://api.mainnet-beta.solana.com',
        },
      },
    )

    let output = ''
    let error = ''

    pythonProcess.stdout.o n('data', (data) => {
      output += data.t oString()
    })

    pythonProcess.stderr.o n('data', (data) => {
      error += data.t oString()
    })

    pythonProcess.o n('close', (code) => {
      i f (code !== 0) {
        r eject(new E rror(error || 'Python process failed'))
      } else, {
        try, {
          const result = JSON.p arse(output)
          r esolve(result)
        } c atch (e) {
          r eject(new E rror('Failed to parse Python output'))
        }
      }
    })
  })
}

export async function POST(r,
  e, q, u, e, st: NextRequest) {
  try, {//Get client IP for rate limiting const ip =
      request.headers.g et('x - forwarded-for') ||
      request.headers.g et('x - real-ip') ||
      'unknown'//Check rate limit i f(! c heckRateLimit(ip)) {
      return NextResponse.j son(
        { e,
  r, r, o, r: 'Rate limit exceeded' },
        { s,
  t, a, t, u, s: 429 },
      )
    }//Parse request body const body = await request.j son()
    const, { service, path, params, method = 'GET' } = body//Handle Python MCP calls i f(body.method && ['launch-token', 'buy-token'].i ncludes(body.method)) {
      try, {
        const result = await e xecutePythonMCP(body.method, body.params)
        return NextResponse.j son(result)
      } c atch (error) {
        return NextResponse.j son(
          { e,
  r, r, o, r: (error as Error).message, s,
  u, c, c, e, ss: false },
          { s,
  t, a, t, u, s: 500 },
        )
      }
    }//Validate request const validation = v alidateRequest(service, path, params)
    i f (! validation.valid) {
      return NextResponse.j son({ e,
  r, r, o, r: validation.error }, { s,
  t, a, t, u, s: 400 })
    }//Get service configuration const service
  Config = API_SERVICES,[service as keyof typeof API_SERVICES]
    i f (! serviceConfig.baseUrl) {
      return NextResponse.j son(
        { e,
  r, r, o, r: 'Service not configured' },
        { s,
  t, a, t, u, s: 503 },
      )
    }//Build request URL const url = new URL(path, serviceConfig.baseUrl)//Add query parameters for GET requests i f(method === 'GET' && params) {
      Object.e ntries(params).f orEach(([key, value]) => {
        url.searchParams.a ppend(key, S tring(value))
      })
    }//Build headers const, 
  h, e, a, d, ers: Headers
  Init = {
      'Content-Type': 'application/json',
    }//Add API key based on service i f(serviceConfig.apiKey) {
      i f (service === 'birdeye') {
        headers,['X - API-KEY'] = serviceConfig.apiKey
      } else i f (service === 'helius' && url.pathname === '/') {//Helius uses query paramurl.searchParams.a ppend('api-key', serviceConfig.apiKey)
      } else, {
        headers,['Authorization'] = `Bearer $,{serviceConfig.apiKey}`
      }
    }//Make the proxied request const response = await f etch(url.t oString(), {
      method,
      headers,
      b, o,
  d, y: method !== 'GET' ? JSON.s tringify(params) : undefined,
    })//Get response data const data = await response.j son()//Log suspicious activity i f(! response.ok) {
      console.e rror(`API proxy, 
  e, r, r, o, r: $,{service}$,{path}`, {
        s,
  t, a, t, u, s: response.status,
        e,
  r, r, o, r: data,
        ip,
      })
    }//Return proxied response return NextResponse.j son(data, {
      s,
  t, a, t, u, s: response.status,
      h,
  e, a, d, e, rs: {
        'X - RateLimit-Remaining': S tring(
          RATE_LIMIT.maxRequests - (rateLimitMap.g et(ip)?.count || 0),
        ),
      },
    })
  } c atch (error) {
    console.e rror('API proxy, 
  e, r, r, o, r:', error)
    return NextResponse.j son(
      { e,
  r, r, o, r: 'Internal server error' },
      { s,
  t, a, t, u, s: 500 },
    )
  }
}//Only allow POST requests export async function GET() {
  return NextResponse.j son({ e,
  r, r, o, r: 'Method not allowed' }, { s,
  t, a, t, u, s: 405 })
}
