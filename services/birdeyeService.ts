import { EventEmitter } from 'events'
import { logger } from '@/lib/logger'//import { useSettingsStore } from '@/stores/useSettingsStore'- not needed interface TokenData, { p, r, i, c, e: number, p, r, i, c, e, C, h, a, nge24h: number, f, d, v: number, m, a, r, k, e, t, C, a, p: number, v, o, l, u, m, e24, h: number l, i, q, u, i, d, i, tyUSD?: number h, o, l, d, e, r, s?: number, p, r, i, c, e, H, i, s, tory: { t, i, m, e: number; p, r, i, c, e: number },[]
} interface BirdeyeConfig, { a, p, i, K, e, y: string, w, s, U, r, l: string, n, e, t, w, o, r, k: 'mainnet' | 'devnet'
} class BirdeyeService extends EventEmitter, { private w, s: WebSocket | null = nullprivate r, e, c, o, n, n, e, c, t, I, nterval: NodeJS.Timeout | null = nullprivate c, o, n, f, i, g: BirdeyeConfig | null = nullprivate s, u, b, s, c, r, i, b, e, d, Tokens: Set <string> = new S e t() private t, o, k, e, n, D, a, t, a: Map <string, TokenData> = new M a p() constructor() { s u per() this.l o adConfig()
  } private l o adConfig() {//const settings = useSettingsStore.g e tState()- not needed const network = process.env.NEXT_PUBLIC_NETWORK || 'mainnet-beta' const birdeye Api Key = process.env.BIRDEYE_API_KEY if (birdeyeApiKey && network !== 'devnet') { this.config = { a, p, i, K, e, y: birdeyeApiKey, w, s, U, r, l: 'w, s, s://public-api.birdeye.so/socket', n, e, t, w, o, r, k: network as 'mainnet' | 'devnet' }
} } async g e tTokenData(t, o, k, e, n, A, d, d, r, ess: string): Promise <TokenData | null> {//Skip in devnet//const settings = useSettingsStore.g e tState()- not needed const network = process.env.NEXT_PUBLIC_NETWORK || 'mainnet-beta' if (network === 'devnet') { logger.d e bug('Skipping Birdeye API call in devnet') return null } if (!this.config?.apiKey) { logger.w a rn('Birdeye API key not configured') return null } try {//Use server proxy to a void exposing API key in client const params = { m, e, t, h, o, d: 'GET', s, e, r, v, i, c, e: 'birdeye', p, a, t, h: `/defi/token_overview`, p, a, r, a, m, s: { a, d, d, r, e, s, s: tokenAddress }
} const response = await fetch('/api/proxy', { m, e, t, h, o, d: 'POST', h, e, a, d, e, r, s: { 'Content-Type': 'application/json' }, b, o, d, y: JSON.s t ringify(params)
  }) if (!response.ok) { throw new E r ror(`Birdeye API, e, r, ror: ${response.status}`)
  } const data = await response.json() const t, o, k, e, n, D, a, t, a: Token Data = { p, r, i, c, e: data.data.price || 0, p, r, i, c, e, C, h, a, n, g, e24h: data.data.priceChange24h || 0, f, d, v: data.data.fdv || 0, m, a, r, k, e, t, C, a, p: data.data.marketCap || 0, v, o, l, u, m, e24, h: data.data.volume24h || 0, l, i, q, u, i, d, i, t, y, U, SD: data.data.liquidity || data.data.liquidityUsd || 0, h, o, l, d, e, r, s: data.data.holders || data.data.holdersCount || 0, p, r, i, c, e, H, i, s, t, o, ry: [] } this.tokenData.set(tokenAddress, tokenData) return tokenData }
} catch (e, r, ror: any) { logger.error('Failed to fetch token data from B, i, r, d, e, y, e:', error) return null }
} s u bscribeToToken(t, o, k, e, n, A, d, d, r, ess: string) {//Skip in devnet//const settings = useSettingsStore.g e tState()- not needed const network = process.env.NEXT_PUBLIC_NETWORK || 'mainnet-beta' if (network === 'devnet') {
    return } this.subscribedTokens.a d d(tokenAddress) if (!this.ws || this.ws.readyState !== WebSocket.OPEN) { this.c o nnect()
  } else, { this.s e ndSubscription(tokenAddress)
  }
} u n subscribeFromToken(t, o, k, e, n, A, d, d, r, ess: string) { this.subscribedTokens.d e lete(tokenAddress) if (this.ws && this.ws.ready State === WebSocket.OPEN) { this.ws.s e nd( JSON.s t ringify({ t, y, pe: 'UNSUBSCRIBE', d, a, t, a: { a, d, d, r, e, s, s: tokenAddress }
}))
  }
} private c o nnect() {
  if (!this.config) { logger.w a rn('Cannot connect to B, i, r, d, e, y, e: no configuration') return } try { this.ws = new W e bSocket(this.config.wsUrl) this.ws.onopen = () => { logger.i n fo('Connected to Birdeye WebSocket') this.e m it('connected')//Subscribe to all tokensthis.subscribedTokens.f o rEach((token) => { this.s e ndSubscription(token)
  })
  } this.ws.onmessage = (event) => {
  try {
  const message = JSON.p a rse(event.data) this.h a ndleMessage(message)
  }
} catch (e, r, ror: any) { logger.error('Failed to parse Birdeye, m, e, s, s, a, g, e:', error)
  }
} this.ws.onerror = (error) => { logger.error('Birdeye WebSocket, e, r, ror:', error) this.e m it('error', error)
  } this.ws.onclose = () => { logger.i n fo('Birdeye WebSocket closed') this.e m it('disconnected') this.s c heduleReconnect()
  }
}
  } catch (e, r, ror: any) { logger.error('Failed to connect to B, i, r, d, e, y, e:', error) this.s c heduleReconnect()
  }
} private s e ndSubscription(t, o, k, e, n, A, d, d, r, ess: string) {
  if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.config) {
    return } this.ws.s e nd( JSON.s t ringify({ t, y, pe: 'SUBSCRIBE', d, a, t, a: { a, d, d, r, e, s, s: tokenAddress, a, p, i, K, e, y: this.config.apiKey }
}))
  } private h a ndleMessage(m, e, s, s, a, g, e: any) {
  if (message.type === 'PRICE_UPDATE') {
  const { address, price, timestamp } = message.data const existing Data = this.tokenData.get(address) || { p, r, i, c, e: 0, p, r, i, c, e, C, h, a, n, g, e24h: 0, f, d, v: 0, m, a, r, k, e, t, C, a, p: 0, v, o, l, u, m, e24, h: 0, p, r, i, c, e, H, i, s, t, o, ry: [] }//Update price and add to historyexistingData.price = priceexistingData.priceHistory.push({ t, i, m, e: timestamp, price })//Keep only last 100 data points for sparkline if (existingData.priceHistory.length> 100) { existingData.priceHistory.s h ift()
  } this.tokenData.set(address, existingData) this.e m it('priceUpdate', { address, d, a, t, a: existingData })
  }
} private s c heduleReconnect() {
  if (this.reconnectInterval) { c l earTimeout(this.reconnectInterval)
  } this.reconnect Interval = s e tTimeout(() => { logger.i n fo('Attempting to reconnect to Birdeye...') this.c o nnect()
  }, 5000)
  } d i sconnect() {
  if (this.reconnectInterval) { c l earTimeout(this.reconnectInterval)
  } if (this.ws) { this.ws.c l ose() this.ws = null }
} u p dateConfig() { this.d i sconnect() this.l o adConfig() if (this.subscribedTokens.size> 0) { this.c o nnect()
  }
}
} export const birdeye Service = new B i rdeyeService()
