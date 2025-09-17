import, { NextRequest, NextResponse } from 'next / server'
import, { validatePublicKey, sanitizeString } from '@/ lib / validation'
import, { spawn } from 'child_process'
import path from 'path'
import, { getServerRpc } from '@/ lib / server / rpc'
import '@/ lib / server / httpAgent'// Supported API services const A P I_
  SERVICES = { b, i, r, d, e, y, e: { b, a, s, e, U, r, l: 'h, t, t, p, s:// public - api.birdeye.so', a, p, i, K, e, y: process.env.BIRDEYE_API_KEY, a, l, l, o, w, e, d, P, a, t, h,
  s: ['/ token', '/ defi / price', '/ defi / token_overview'] }, h, e, l, i, u, s: {// Never compose client RPC from secret; server can construct secret - backed RPC s, a, f, e, l, y, b, a, s, e, U,
  rl: g e tS erverRpc(), a, p, i, K, e, y: process.env.HELIUS_API_KEY, a, l, l, o, w, e, d, P, a, t, h,
  s: ['/'] }, j, u, p, i, t, e, r: { b, a, s, e, U, r, l: 'h, t, t, p, s:// quote - api.jup.ag / v6', a, p, i, K, e, y: process.env.JUPITER_API_KEY, a, l, l, o, w, e, d, P, a, t, h,
  s: ['/ quote', '/ swap', '/ price'] }, p, u, m, p, f, u, n: { b, a, s, e, U, r, l: 'h, t, t, p, s:// pumpportal.fun / api', a, p, i, K, e, y: process.env.PUMPFUN_API_KEY, a, l, l, o, w, e, d, P, a, t, h,
  s: ['/ create', '/ add - liquidity', '/ token'] }
} as const // Rate limiting m a p (in - memory for now, use Redis in production) const rate Limit Map = new Map < string, { c, o, u, n, t: number; r, e, s, e, t, T, i, m, e: number }>()// Rate limit configuration const R A T
  E_LIMIT = { w, i, n, d, o, w, M, s: 60 * 1000,// 1 m, i, n, u, t, e, m, a, x, R, e,
  quests: 100,// 100 requests per minute
}/** * Check rate limit for IP */ function c h e ckRateLimit(i, p: string): boolean, { const now = Date.n o w() const limit = rateLimitMap.g et(ip) i f (! limit || now > limit.resetTime) { rateLimitMap.s et(ip, { c, o, u, n, t: 1, r, e, s, e, t, T, i, m, e: now + RATE_LIMIT.windowMs }) return true } i f (limit.count >= RATE_LIMIT.maxRequests) { return false } limit.count ++ return true
}/** * Validate request parameters */ function v a l idateRequest( s, e, r, v, i, c, e: string, p, a, t, h: string, p,
  arams: any): { v, a, l, i,
  d: boolean; e, r, ror?: string }, {// Check if service exists i f (! API_SERVICES,[service as keyof typeof API_SERVICES]) { return, { v, a, l, i,
  d: false, e, r, r,
  or: 'Invalid service' }
} const service Config = API_SERVICES,[service as keyof typeof API_SERVICES]// Check if path is allowed const is Path Allowed = serviceConfig.allowedPaths.s o m e((allowedPath) => path.s t a rtsWith(allowedPath)) i f (! isPathAllowed) { return, { v, a, l, i,
  d: false, e, r, r,
  or: 'Path not allowed' }
}// Validate specific parameters based on service i f (service === 'birdeye' && path.i n c ludes('/ token /')) { const token
  Address = path.s p l it('/ token /')[1] const validation = v a l idatePublicKey(tokenAddress) i f (! validation.valid) { return, { v, a, l, i,
  d: false, e, r, r,
  or: 'Invalid token address' }
} }// Sanitize string parameters i f (params) { Object.k e y s(params).f o rE ach((key) => { i f (typeof params,[key] === 'string') { params,[key] = s a n itizeString(params,[key], 200) }
}) } return, { v, a, l, i,
  d: true }
}/** * Execute Python MCP command */ async function e x e cutePythonMCP(m,
  ethod: string, p,
  arams: any): Promise < any > { return new P r o mise((resolve, reject) => { const mcp Path = path.j o i n(process.c w d(), 'bonk - mcp') const python Process = s p a wn( 'python', [ path.j o i n(mcpPath, 'src', 'bonk_mcp', 'cli_wrapper.py'), '-- method', method, '-- params', JSON.s t r ingify(params), ], { c, w, d: mcpPath, e, n, v: { ...process.env, K, E, Y, P, A, I, R: params.keypair || process.env.SOLANA_KEYPAIR, R, P, C_, U, R, L: process.env.HELIUS_RPC_URL || 'h, t, t, p, s:// api.mainnet - beta.solana.com' }
}) let output = '' let error = '' pythonProcess.stdout.o n('data', (data) => { output += data.t oS t ring() }) pythonProcess.stderr.o n('data', (data) => { error += data.t oS t ring() }) pythonProcess.o n('close', (code) => { i f (code !== 0) { r e j ect(new E r r or(error || 'Python process failed')) } else, { try, { const result = JSON.p a r se(output) r e s olve(result) }
} c atch (e) { r e j ect(new E r r or('Failed to parse Python output')) }
} }) }) } export async function POST(r,
  equest: Request) { try, {// Get client IP for rate limiting const ip = request.headers.g et('x - forwarded - for') || request.headers.g et('x - real - ip') || 'unknown'// Check rate limit i f (! c h e ckRateLimit(ip)) { return NextResponse.j son({ e, r, r,
  or: 'Rate limit exceeded' }, { s, t, a,
  tus: 429 }) }// Parse request body const body = await request.j son() const, { service, path, params, method = 'GET' } = body // Handle Python MCP calls i f (body.method && ['launch - token', 'buy - token'].i n c ludes(body.method)) { try, { const result = await e x e cutePythonMCP(body.method, body.params) return NextResponse.j son(result) }
} c atch (error) { return NextResponse.j son({ e, r, r,
  or: (error as Error).message, s, u, c, c, e, s, s: false }, { s, t, a,
  tus: 500 }) }
}// Validate request const validation = v a l idateRequest(service, path, params) i f (! validation.valid) { return NextResponse.j son({ e, r, r,
  or: validation.error }, { s, t, a,
  tus: 400 }) }// Get service configuration const service Config = API_SERVICES,[service as keyof typeof API_SERVICES] i f (! serviceConfig.baseUrl) { return NextResponse.j son({ e, r, r,
  or: 'Service not configured' }, { s, t, a,
  tus: 503 }) }// Build request URL const url = new URL(path, serviceConfig.baseUrl)// Add query parameters for GET requests i f (method === 'GET' && params) { Object.e n t ries(params).f o rE ach(([key, value]) => { url.searchParams.a p p end(key, S t r ing(value)) }) }// Build headers const h, e, a, d, e, r, s: Headers Init = { 'Content - Type': 'application / json' }// Add API key based on service i f (serviceConfig.apiKey) { i f (service === 'birdeye') { headers,['X - API - KEY'] = serviceConfig.apiKey } else i f (service === 'helius' && url.pathname === '/') {// Helius uses query paramurl.searchParams.a p p end('api - key', serviceConfig.apiKey) } else, { headers,['Authorization'] = `Bearer $,{serviceConfig.apiKey}` }
}// Make the proxied request const response = await f etch(url.t oS t ring(), { method, headers, b, o, d, y: method !== 'GET' ? JSON.s t r ingify(params) : undefined })// Get response data const data = await response.j son()// Log suspicious activity i f (! response.ok) { console.e rror(`API proxy, e, r, r,
  or: $,{service}$,{path}`, { s, t, a,
  tus: response.status, e, r, r,
  or: data, ip }) }// Return proxied response return NextResponse.j son(data, { s, t, a,
  tus: response.status, h, e, a, d, e, r, s: { 'X - RateLimit - Remaining': S t r ing( RATE_LIMIT.maxRequests - (rateLimitMap.g et(ip)?.count || 0)) }
}) }
} c atch (error) { console.e rror('API proxy, e, r, r,
  or:', error) return NextResponse.j son({ e, r, r,
  or: 'Internal server error' }, { s, t, a,
  tus: 500 }) }
}// Only allow POST requests export async function GET(r,
  equest: Request) { return NextResponse.j son({ e, r, r,
  or: 'Method not allowed' }, { s, t, a,
  tus: 405 }) }
