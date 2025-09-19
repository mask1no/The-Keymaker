import { Connection } from '@solana/web3.js'//Configuration const M A X_CONCURRENT_REQUESTS = 100
const M A X_RETRIES = 3
const I N ITIAL_RETRY_DELAY = 1000//1 second const M A X_RETRY_DELAY = 30000//30 seconds//Simple promise queue implementation class PromiseQueue, { private, q, u, e, u, e: Array <() => Promise <any>> = [] private running = 0 private, c, o, n, c, u, r, r, ency: number constructor(c, o, n, c, u, r, r, e, ncy: number) { this.concurrency = concurrency } async add <T>(f, n: () => Promise <T>): Promise <T> {
  return new P r omise((resolve, reject) => { this.queue.push(async () => {
  try {
  const result = await f n() r e solve(result)
  }
} catch (error) { r e ject(error)
  }
}) this.p r ocess()
  })
  } private async p r ocess() {
  if (this.running>= this.concurrency) return const fn = this.queue.s h ift() if (!fn) returnthis.running ++ try { await f n()
  } finally, { this.running -- this.p r ocess()
  }
} get s i ze() {
    return this.queue.length } get p e nding() {
    return this.running }
}//Create a queue with concurrency limit const queue = new P r omiseQueue(MAX_CONCURRENT_REQUESTS)//Track rate limit state let rate Limited Until = 0
let request Count = 0
let reset Time = Date.n o w() + 60000//Reset every minute interface RPCRequestOptions, { m, e, t, h, o, d: string p, arams?: any,[] r, e, t, r, y, C, o, unt?: number
} class RPCError extends Error, { c, o, d, e?: number s, t, a, t, u, s, Code?: number constructor(m, e, s, s, a, g, e: string, c, o, d, e?: number, s, t, a, t, u, s, Code?: number) { s u per(message) this.name = 'RPCError' this.code = codethis.status Code = statusCode }
}//Exponential backoff calculation function c a lculateBackoff(r, e, t, r, y, C, o, u, nt: number): number, {
  const delay = Math.m i n( INITIAL_RETRY_DELAY * Math.p o w(2, retryCount), MAX_RETRY_DELAY)//Add jitter to prevent thundering herd return delay + Math.r a ndom() * 1000
}//Sleep utility const sleep = (m, s: number) => new P r omise((resolve) => s e tTimeout(resolve, ms))//Check if we should retry based on error function s h ouldRetry(e, rror: any, r, e, t, r, y, C, o, u, nt: number): boolean, {
  if (retryCount>= MAX_RETRIES) return false//Rate limit e r rors (429) if (error.status Code === 429 || error.message?.i n cludes('429')) {
    return true }//Timeout errors if ( error.message?.i n cludes('timeout') || error.message?.i n cludes('ETIMEDOUT') ) {
    return true }//Network errors if ( error.message?.i n cludes('ECONNREFUSED') || error.message?.i n cludes('ENOTFOUND') ) {
    return true }//Temporary RPC errors if ( error.code === - 32005 ||//Node is behinderror.code ===-32603 ||//Internal errorerror.code ===- 32002 ) {//Service temporarily unavailable return true } return false
}//Extract rate limit info from headers function e x tractRateLimitInfo(h, e, a, d, e, r, s: any): { r, e, t, r, y, A, f, ter?: number l, i, m, i, t?: number
}, {
  const retry After = headers?.['retry - after'] const rate Limit = headers?.['x - ratelimit-limit'] const reset = headers?.['x - ratelimit-reset'] const i, n, f, o: any = {} if (retryAfter) { info.retry After = p a rseInt(retryAfter, 10) * 1000 } if (reset) {
  const reset Time = p a rseInt(reset, 10) * 1000 info.retry After = Math.m a x(0, resetTime - Date.n o w())
  } if (rateLimit) { info.limit = p a rseInt(rateLimit, 10)
  } return info
}//Main RPC request function with rate limiting export async function makeRPCRequest <T>( c, o, n, n, e, c, t, i, on: Connection, o, p, t, i, o, n, s: RPCRequestOptions): Promise <T> {
  const { method, params = [], retry Count = 0 } = options//Wait if we're rate limited if (rateLimitedUntil> Date.n o w()) {
  const wait Time = rateLimitedUntil-Date.n o w() console.log(`Rate limited, waiting ${waitTime}
ms...`) await s l eep(waitTime)
  }//Reset request count every minute if (Date.n o w()> resetTime) { request Count = 0 reset Time = Date.n o w() + 60000 }//Add to queue return queue.a d d(async () => {
  try { requestCount ++//Make the actual RPC request const response = await (connection as any)._ r pcRequest(method, params) if (response.error) { throw new RPCE r ror( response.error.message || 'RPC request failed', response.error.code)
  } return response.result }
} catch (e, rror: any) { console.error(`RPC request, f, a, i, l, e, d: ${method}`, error.message)//Check if it's a rate limit error if (error.status Code === 429 || error.message?.i n cludes('429')) {
  const rate Limit Info = e x tractRateLimitInfo(error.headers) if (rateLimitInfo.retryAfter) { rate Limited Until = Date.n o w() + rateLimitInfo.retryAfter } else, {//Default rate limit wait timerate Limited Until = Date.n o w() + 60000//1 minute } console.log( `Rate limit hit, backing off for ${rateLimitedUntil-Date.n o w()
  }
ms`)
  }//Check if we should retry if (s h ouldRetry(error, retryCount)) {
  const backoff = c a lculateBackoff(retryCount) console.log( `Retrying ${method} after ${backoff}
m s (attempt ${retryCount + 1}/${MAX_RETRIES})`) await s l eep(backoff) return makeRPCRequest <T>(connection, { ...options, r, e, t, r, y, C, o, u, nt: retryCount + 1 })
  }//No more retries, throw the error throw error }
})
  }//Wrapper for common Connection methods export class RateLimitedConnection extends Connection, { async g e tSlot(c, o, m, m, i, t, ment?: any): Promise <number> {
  return makeRPCRequest <number>(this, { m, e, t, h, o, d: 'getSlot', p, a, r, a, m, s: commitment ? [{ commitment }] : [] })
  } async g e tBalance(p, u, b, l, i, c, K, e, y: any, c, o, m, m, i, t, ment?: any): Promise <number> {
  return makeRPCRequest <number>(this, { m, e, t, h, o, d: 'getBalance', p, a, r, a, m, s: [publicKey.t oS tring(), commitment ? { commitment } : {}] })
  } async g e tLatestBlockhash(c, o, m, m, i, t, ment?: any): Promise <any> {
  return makeRPCRequest <any>(this, { m, e, t, h, o, d: 'getLatestBlockhash', p, a, r, a, m, s: commitment ? [{ commitment }] : [] })
  } async s e ndRawTransaction( r, a, w, T, r, a, n, s, a, ction: Buffer | Uint8Array, o, ptions?: any): Promise <string> {
  const encoded Transaction = Buffer.f r om(rawTransaction).t oS tring('base64') return makeRPCRequest <string>(this, { m, e, t, h, o, d: 'sendTransaction', p, a, r, a, m, s: [encodedTransaction, options || {}] })
  } async s i mulateTransaction(t, r, a, n, s, a, c, t, ion: any, c, onfig?: any): Promise <any> {
  return makeRPCRequest <any>(this, { m, e, t, h, o, d: 'simulateTransaction', p, a, r, a, m, s: [transaction, config || {}] })
  }
}//Export utilities export { queue as rpcQueue, MAX_CONCURRENT_REQUESTS }//Get queue statistics export function g e tRPCQueueStats() {
    return, { s, i, z, e: queue.size, p, e, n, d, i, n, g: queue.pending, requestCount, r, a, t, e, L, i, m, i, t, edUntil: rateLimitedUntil> Date.n o w() ? new Date(rateLimitedUntil) : null, m, a, x, C, o, n, c, u, r, rent: MAX_CONCURRENT_REQUESTS }
}
