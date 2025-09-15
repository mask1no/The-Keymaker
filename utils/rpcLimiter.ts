import { Connection } from '@solana/web3.js'

// Configurationconst MAX_CONCURRENT_REQUESTS = 100
const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 1000 // 1 secondconst MAX_RETRY_DELAY = 30000 // 30 seconds

// Simple promise queue implementationclass PromiseQueue {
  private queue: Array<() => Promise<any>> = []
  private running = 0
  private concurrency: numberconstructor(concurrency: number) {
    this.concurrency = concurrency
  }

  async add<T>(fn: () => Promise<T>): Promise<T> {
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
    if (this.running >= this.concurrency) returnconst fn = this.queue.shift()
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

// Create a queue with concurrency limitconst queue = new PromiseQueue(MAX_CONCURRENT_REQUESTS)

// Track rate limit statelet rateLimitedUntil = 0
let requestCount = 0
let resetTime = Date.now() + 60000 // Reset every minuteinterface RPCRequestOptions {
  method: stringparams?: any[]
  retryCount?: number
}

class RPCError extends Error {
  code?: numberstatusCode?: numberconstructor(message: string, code?: number, statusCode?: number) {
    super(message)
    this.name = 'RPCError'
    this.code = codethis.statusCode = statusCode
  }
}

// Exponential backoff calculationfunction calculateBackoff(retryCount: number): number {
  const delay = Math.min(
    INITIAL_RETRY_DELAY * Math.pow(2, retryCount),
    MAX_RETRY_DELAY,
  )
  // Add jitter to prevent thundering herdreturn delay + Math.random() * 1000
}

// Sleep utilityconst sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Check if we should retry based on errorfunction shouldRetry(error: any, retryCount: number): boolean {
  if (retryCount >= MAX_RETRIES) return false

  // Rate limit errors (429)
  if (error.statusCode === 429 || error.message?.includes('429')) {
    return true
  }

  // Timeout errorsif (
    error.message?.includes('timeout') ||
    error.message?.includes('ETIMEDOUT')
  ) {
    return true
  }

  // Network errorsif (
    error.message?.includes('ECONNREFUSED') ||
    error.message?.includes('ENOTFOUND')
  ) {
    return true
  }

  // Temporary RPC errorsif (
    error.code === -32005 || // Node is behinderror.code === -32603 || // Internal errorerror.code === -32002
  ) {
    // Service temporarily unavailablereturn true
  }

  return false
}

// Extract rate limit info from headersfunction extractRateLimitInfo(headers: any): {
  retryAfter?: numberlimit?: number
} {
  const retryAfter = headers?.['retry-after']
  const rateLimit = headers?.['x-ratelimit-limit']
  const reset = headers?.['x-ratelimit-reset']

  const info: any = {}

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

// Main RPC request function with rate limitingexport async function makeRPCRequest<T>(
  connection: Connection,
  options: RPCRequestOptions,
): Promise<T> {
  const { method, params = [], retryCount = 0 } = options

  // Wait if we're rate limitedif (rateLimitedUntil > Date.now()) {
    const waitTime = rateLimitedUntil - Date.now()
    console.log(`Rate limited, waiting ${waitTime}ms...`)
    await sleep(waitTime)
  }

  // Reset request count every minuteif (Date.now() > resetTime) {
    requestCount = 0
    resetTime = Date.now() + 60000
  }

  // Add to queuereturn queue.add(async () => {
    try {
      requestCount++

      // Make the actual RPC requestconst response = await (connection as any)._rpcRequest(method, params)

      if (response.error) {
        throw new RPCError(
          response.error.message || 'RPC request failed',
          response.error.code,
        )
      }

      return response.result
    } catch (error: any) {
      console.error(`RPC request failed: ${method}`, error.message)

      // Check if it's a rate limit errorif (error.statusCode === 429 || error.message?.includes('429')) {
        const rateLimitInfo = extractRateLimitInfo(error.headers)

        if (rateLimitInfo.retryAfter) {
          rateLimitedUntil = Date.now() + rateLimitInfo.retryAfter
        } else {
          // Default rate limit wait timerateLimitedUntil = Date.now() + 60000 // 1 minute
        }

        console.log(
          `Rate limit hit, backing off for ${rateLimitedUntil - Date.now()}ms`,
        )
      }

      // Check if we should retryif (shouldRetry(error, retryCount)) {
        const backoff = calculateBackoff(retryCount)
        console.log(
          `Retrying ${method} after ${backoff}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`,
        )

        await sleep(backoff)

        return makeRPCRequest<T>(connection, {
          ...options,
          retryCount: retryCount + 1,
        })
      }

      // No more retries, throw the errorthrow error
    }
  })
}

// Wrapper for common Connection methodsexport class RateLimitedConnection extends Connection {
  async getSlot(commitment?: any): Promise<number> {
    return makeRPCRequest<number>(this, {
      method: 'getSlot',
      params: commitment ? [{ commitment }] : [],
    })
  }

  async getBalance(publicKey: any, commitment?: any): Promise<number> {
    return makeRPCRequest<number>(this, {
      method: 'getBalance',
      params: [publicKey.toString(), commitment ? { commitment } : {}],
    })
  }

  async getLatestBlockhash(commitment?: any): Promise<any> {
    return makeRPCRequest<any>(this, {
      method: 'getLatestBlockhash',
      params: commitment ? [{ commitment }] : [],
    })
  }

  async sendRawTransaction(
    rawTransaction: Buffer | Uint8Array,
    options?: any,
  ): Promise<string> {
    const encodedTransaction = Buffer.from(rawTransaction).toString('base64')
    return makeRPCRequest<string>(this, {
      method: 'sendTransaction',
      params: [encodedTransaction, options || {}],
    })
  }

  async simulateTransaction(transaction: any, config?: any): Promise<any> {
    return makeRPCRequest<any>(this, {
      method: 'simulateTransaction',
      params: [transaction, config || {}],
    })
  }
}

// Export utilitiesexport { queue as rpcQueue, MAX_CONCURRENT_REQUESTS }

// Get queue statisticsexport function getRPCQueueStats() {
  return {
    size: queue.size,
    pending: queue.pending,
    requestCount,
    rateLimitedUntil:
      rateLimitedUntil > Date.now() ? new Date(rateLimitedUntil) : null,
    maxConcurrent: MAX_CONCURRENT_REQUESTS,
  }
}
