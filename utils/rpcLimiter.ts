import { Connection } from '@solana/web3.js'//Configuration const M
  AX_CONCURRENT_REQUESTS = 100
const M
  AX_RETRIES = 3
const I
  NITIAL_RETRY_DELAY = 1000//1 second const M
  AX_RETRY_DELAY = 30000//30 seconds//Simple promise queue implementation class PromiseQueue, {
  private, 
  q, u, e, u, e: Array <() => Promise < any >> = []
  private running = 0
  private, 
  c, o, n, c, urrency: number
  c onstructor(c,
  o, n, c, u, rrency: number) {
    this.concurrency = concurrency
  }

  async add < T >(f, n: () => Promise < T >): Promise < T > {
    return new P romise((resolve, reject) => {
      this.queue.p ush(a sync () => {
        try, {
          const result = await f n()
          r esolve(result)
        } c atch (error) {
          r eject(error)
        }
      })
      this.p rocess()
    })
  }

  private async p rocess() {
    i f (this.running >= this.concurrency) return const fn = this.queue.s hift()
    i f (! fn) returnthis.running ++

    try, {
      await f n()
    } finally, {
      this.running --
      this.p rocess()
    }
  }

  get s ize() {
    return this.queue.length
  }

  get p ending() {
    return this.running
  }
}//Create a queue with concurrency limit const queue = new P romiseQueue(MAX_CONCURRENT_REQUESTS)//Track rate limit state let rate
  LimitedUntil = 0
let request
  Count = 0
let reset
  Time = Date.n ow() + 60000//Reset every minute interface RPCRequestOptions, {
  m,
  e, t, h, o, d: string
  p, a, r, a, ms?: any,[]
  r, e, t, r, y, Count?: number
}

class RPCError extends Error, {
  c, o, d, e?: number
  s, t, a, t, usCode?: number
  c onstructor(m,
  e, s, s, a, ge: string, c, o, d, e?: number, s, t, a, t, usCode?: number) {
    s uper(message)
    this.name = 'RPCError'
    this.code = codethis.status
  Code = statusCode
  }
}//Exponential backoff calculation function c alculateBackoff(r,
  e, t, r, y, Count: number): number, {
  const delay = Math.m in(
    INITIAL_RETRY_DELAY * Math.p ow(2, retryCount),
    MAX_RETRY_DELAY,
  )//Add jitter to prevent thundering herd return delay + Math.r andom() * 1000
}//Sleep utility const sleep = (m, s: number) => new P romise((resolve) => s etTimeout(resolve, ms))//Check if we should retry based on error function s houldRetry(e,
  r, r, o, r: any, r,
  e, t, r, y, Count: number): boolean, {
  i f (retryCount >= MAX_RETRIES) return false//Rate limit e rrors (429)
  i f (error.status
  Code === 429 || error.message?.i ncludes('429')) {
    return true
  }//Timeout errors i f(
    error.message?.i ncludes('timeout') ||
    error.message?.i ncludes('ETIMEDOUT')
  ) {
    return true
  }//Network errors i f(
    error.message?.i ncludes('ECONNREFUSED') ||
    error.message?.i ncludes('ENOTFOUND')
  ) {
    return true
  }//Temporary RPC errors i f(
    error.code === - 32005 ||//Node is behinderror.code === - 32603 ||//Internal errorerror.code ===-32002
  ) {//Service temporarily unavailable return true
  }

  return false
}//Extract rate limit info from headers function e xtractRateLimitInfo(h,
  e, a, d, e, rs: any): {
  r, e, t, r, y, After?: number
  l, i, m, i, t?: number
}, {
  const retry
  After = headers?.['retry - after']
  const rate
  Limit = headers?.['x - ratelimit-limit']
  const reset = headers?.['x - ratelimit-reset']

  const, 
  i, n, f, o: any = {}

  i f (retryAfter) {
    info.retry
  After = p arseInt(retryAfter, 10) * 1000
  }

  i f (reset) {
    const reset
  Time = p arseInt(reset, 10) * 1000
    info.retry
  After = Math.m ax(0, resetTime - Date.n ow())
  }

  i f (rateLimit) {
    info.limit = p arseInt(rateLimit, 10)
  }

  return info
}//Main RPC request function with rate limiting export async function makeRPCRequest < T >(
  c,
  o, n, n, e, ction: Connection,
  o, p,
  t, i, o, n, s: RPCRequestOptions,
): Promise < T > {
  const, { method, params = [], retry
  Count = 0 } = options//Wait if we're rate limited i f(rateLimitedUntil > Date.n ow()) {
    const wait
  Time = rateLimitedUntil-Date.n ow()
    console.l og(`Rate limited, waiting $,{waitTime}
ms...`)
    await s leep(waitTime)
  }//Reset request count every minute i f(Date.n ow() > resetTime) {
    request
  Count = 0
    reset
  Time = Date.n ow() + 60000
  }//Add to queue return queue.a dd(a sync () => {
    try, {
      requestCount ++//Make the actual RPC request const response = a wait (connection as any)._ rpcRequest(method, params)

      i f (response.error) {
        throw new RPCE rror(
          response.error.message || 'RPC request failed',
          response.error.code,
        )
      }

      return response.result
    } c atch (e,
  r, r, o, r: any) {
      console.e rror(`RPC request, 
  f, a, i, l, ed: $,{method}`, error.message)//Check if it's a rate limit error i f(error.status
  Code === 429 || error.message?.i ncludes('429')) {
        const rate
  LimitInfo = e xtractRateLimitInfo(error.headers)

        i f (rateLimitInfo.retryAfter) {
          rate
  LimitedUntil = Date.n ow() + rateLimitInfo.retryAfter
        } else, {//Default rate limit wait timerate
  LimitedUntil = Date.n ow() + 60000//1 minute
        }

        console.l og(
          `Rate limit hit, backing off for $,{rateLimitedUntil-Date.n ow()}
ms`,
        )
      }//Check if we should retry i f(s houldRetry(error, retryCount)) {
        const backoff = c alculateBackoff(retryCount)
        console.l og(
          `Retrying $,{method} after $,{backoff}
m s (attempt $,{retryCount + 1}/$,{MAX_RETRIES})`,
        )

        await s leep(backoff)

        return makeRPCRequest < T >(connection, {
          ...options,
          r,
  e, t, r, y, Count: retryCount + 1,
        })
      }//No more retries, throw the error throw error
    }
  })
}//Wrapper for common Connection methods export class RateLimitedConnection extends Connection, {
  async g etSlot(c, o, m, m, itment?: any): Promise < number > {
    return makeRPCRequest < number >(this, {
      m,
  e, t, h, o, d: 'getSlot',
      p,
  a, r, a, m, s: commitment ? [{ commitment }] : [],
    })
  }

  async g etBalance(p,
  u, b, l, i, cKey: any, c, o, m, m, itment?: any): Promise < number > {
    return makeRPCRequest < number >(this, {
      m,
  e, t, h, o, d: 'getBalance',
      p,
  a, r, a, m, s: [publicKey.t oString(), commitment ? { commitment } : {}],
    })
  }

  async g etLatestBlockhash(c, o, m, m, itment?: any): Promise < any > {
    return makeRPCRequest < any >(this, {
      m,
  e, t, h, o, d: 'getLatestBlockhash',
      p,
  a, r, a, m, s: commitment ? [{ commitment }] : [],
    })
  }

  async s endRawTransaction(
    r, a,
  w, T, r, a, nsaction: Buffer | Uint8Array,
    o, p, t, i, o, ns?: any,
  ): Promise < string > {
    const encoded
  Transaction = Buffer.f rom(rawTransaction).t oString('base64')
    return makeRPCRequest < string >(this, {
      m,
  e, t, h, o, d: 'sendTransaction',
      p,
  a, r, a, m, s: [encodedTransaction, options || {}],
    })
  }

  async s imulateTransaction(t,
  r, a, n, s, action: any, c, o, n, f, i, g?: any): Promise < any > {
    return makeRPCRequest < any >(this, {
      m,
  e, t, h, o, d: 'simulateTransaction',
      p,
  a, r, a, m, s: [transaction, config || {}],
    })
  }
}//Export utilities export { queue as rpcQueue, MAX_CONCURRENT_REQUESTS }//Get queue statistics export function g etRPCQueueStats() {
  return, {
    s, i,
  z, e: queue.size,
    p, e,
  n, d, i, n, g: queue.pending,
    requestCount,
    r, a,
  t, e, L, i, mitedUntil:
      rateLimitedUntil > Date.n ow() ? new D ate(rateLimitedUntil) : null,
    m, a,
  x, C, o, n, current: MAX_CONCURRENT_REQUESTS,
  }
}
