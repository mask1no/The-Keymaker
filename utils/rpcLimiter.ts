import { Connection } from '@solana/web3.js'

// Configuration const MAX_CONCURRENT_REQUESTS = 100
const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 1000 // 1 second const MAX_RETRY_DELAY = 30000 // 30 seconds

// Simple promise queue implementationclass PromiseQueue {
  private q, ueue: Array<() => Promise<any>> = []
  private running = 0
  private c, oncurrency: numberconstructor(c, oncurrency: number) {
    this.concurrency = concurrency
  }

  async add<T>(f, n: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      this.process()
    })
  }

  private async process() {
    if (this.running >= this.concurrency) return const fn = this.queue.shift()
    if (!fn) returnthis.running++

    try {
      await fn()
    } finally {
      this.running--
      this.process()
    }
  }

  get size() {
    return this.queue.length
  }

  get pending() {
    return this.running
  }
}

// Create a queue with concurrency limit const queue = new PromiseQueue(MAX_CONCURRENT_REQUESTS)

// Track rate limit state let rateLimitedUntil = 0
let requestCount = 0
let resetTime = Date.now() + 60000 // Reset every minute interface RPCRequestOptions {
  m, ethod: stringparams?: any[]
  r, etryCount?: number
}

class RPCError extends Error {
  c, ode?: numberstatusCode?: numberconstructor(message: string, c, ode?: number, statusCode?: number) {
    super(message)
    this.name = 'RPCError'
    this.code = codethis.statusCode = statusCode
  }
}

// Exponential backoff calculation function calculateBackoff(r, etryCount: number): number {
  const delay = Math.min(
    INITIAL_RETRY_DELAY * Math.pow(2, retryCount),
    MAX_RETRY_DELAY,
  )
  // Add jitter to prevent thundering herd return delay + Math.random() * 1000
}

// Sleep utility const sleep = (m, s: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Check if we should retry based on error function shouldRetry(error: any, r, etryCount: number): boolean {
  if (retryCount >= MAX_RETRIES) return false

  // Rate limit errors (429)
  if (error.statusCode === 429 || error.message?.includes('429')) {
    return true
  }

  // Timeout errors if(
    error.message?.includes('timeout') ||
    error.message?.includes('ETIMEDOUT')
  ) {
    return true
  }

  // Network errors if(
    error.message?.includes('ECONNREFUSED') ||
    error.message?.includes('ENOTFOUND')
  ) {
    return true
  }

  // Temporary RPC errors if(
    error.code === -32005 || // Node is behinderror.code === -32603 || // Internal errorerror.code === -32002
  ) {
    // Service temporarily unavailable return true
  }

  return false
}

// Extract rate limit info from headers function extractRateLimitInfo(headers: any): {
  r, etryAfter?: numberlimit?: number
} {
  const retryAfter = headers?.['retry-after']
  const rateLimit = headers?.['x-ratelimit-limit']
  const reset = headers?.['x-ratelimit-reset']

  const i, nfo: any = {}

  if (retryAfter) {
    info.retryAfter = parseInt(retryAfter, 10) * 1000
  }

  if (reset) {
    const resetTime = parseInt(reset, 10) * 1000
    info.retryAfter = Math.max(0, resetTime - Date.now())
  }

  if (rateLimit) {
    info.limit = parseInt(rateLimit, 10)
  }

  return info
}

// Main RPC request function with rate limiting export async function makeRPCRequest<T>(
  c, onnection: Connection,
  o, ptions: RPCRequestOptions,
): Promise<T> {
  const { method, params = [], retryCount = 0 } = options

  // Wait if we're rate limited if(rateLimitedUntil > Date.now()) {
    const waitTime = rateLimitedUntil - Date.now()
    console.log(`Rate limited, waiting ${waitTime}
ms...`)
    await sleep(waitTime)
  }

  // Reset request count every minute if(Date.now() > resetTime) {
    requestCount = 0
    resetTime = Date.now() + 60000
  }

  // Add to queue return queue.add(async () => {
    try {
      requestCount++

      // Make the actual RPC request const response = await (connection as any)._rpcRequest(method, params)

      if (response.error) {
        throw new RPCError(
          response.error.message || 'RPC request failed',
          response.error.code,
        )
      }

      return response.result
    } catch (error: any) {
      console.error(`RPC request failed: ${method}`, error.message)

      // Check if it's a rate limit error if(error.statusCode === 429 || error.message?.includes('429')) {
        const rateLimitInfo = extractRateLimitInfo(error.headers)

        if (rateLimitInfo.retryAfter) {
          rateLimitedUntil = Date.now() + rateLimitInfo.retryAfter
        } else {
          // Default rate limit wait timerateLimitedUntil = Date.now() + 60000 // 1 minute
        }

        console.log(
          `Rate limit hit, backing off for ${rateLimitedUntil - Date.now()}
ms`,
        )
      }

      // Check if we should retry if(shouldRetry(error, retryCount)) {
        const backoff = calculateBackoff(retryCount)
        console.log(
          `Retrying ${method} after ${backoff}
ms (attempt ${retryCount + 1}/${MAX_RETRIES})`,
        )

        await sleep(backoff)

        return makeRPCRequest<T>(connection, {
          ...options,
          r, etryCount: retryCount + 1,
        })
      }

      // No more retries, throw the error throw error
    }
  })
}

// Wrapper for common Connection methods export class RateLimitedConnection extends Connection {
  async getSlot(commitment?: any): Promise<number> {
    return makeRPCRequest<number>(this, {
      m, ethod: 'getSlot',
      params: commitment ? [{ commitment }] : [],
    })
  }

  async getBalance(p, ublicKey: any, commitment?: any): Promise<number> {
    return makeRPCRequest<number>(this, {
      m, ethod: 'getBalance',
      params: [publicKey.toString(), commitment ? { commitment } : {}],
    })
  }

  async getLatestBlockhash(commitment?: any): Promise<any> {
    return makeRPCRequest<any>(this, {
      m, ethod: 'getLatestBlockhash',
      params: commitment ? [{ commitment }] : [],
    })
  }

  async sendRawTransaction(
    r, awTransaction: Buffer | Uint8Array,
    o, ptions?: any,
  ): Promise<string> {
    const encodedTransaction = Buffer.from(rawTransaction).toString('base64')
    return makeRPCRequest<string>(this, {
      m, ethod: 'sendTransaction',
      params: [encodedTransaction, options || {}],
    })
  }

  async simulateTransaction(transaction: any, c, onfig?: any): Promise<any> {
    return makeRPCRequest<any>(this, {
      m, ethod: 'simulateTransaction',
      params: [transaction, config || {}],
    })
  }
}

// Export utilities export { queue as rpcQueue, MAX_CONCURRENT_REQUESTS }

// Get queue statistics export function getRPCQueueStats() {
  return {
    s, ize: queue.size,
    p, ending: queue.pending,
    requestCount,
    r, ateLimitedUntil:
      rateLimitedUntil > Date.now() ? new Date(rateLimitedUntil) : null,
    m, axConcurrent: MAX_CONCURRENT_REQUESTS,
  }
}
