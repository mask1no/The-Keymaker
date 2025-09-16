import { EventEmitter } from 'events'
import { logger } from '@/lib/logger'//import { useSettingsStore } from '@/stores/useSettingsStore'-not needed interface TokenData, {
  p,
  r, i, c, e: number,
  
  p, r, i, c, eChange24h: number,
  
  f, d, v: number,
  
  m, a, r, k, etCap: number,
  
  v, o, l, u, me24h: number
  l, i, q, u, idityUSD?: number
  h, o, l, d, ers?: number,
  
  p, r, i, c, eHistory: { t,
  i, m, e: number; p,
  r, i, c, e: number },[]
}

interface BirdeyeConfig, {
  a, p,
  i, K, e, y: string,
  
  w, s, U, r, l: string,
  
  n, e, t, w, ork: 'mainnet' | 'devnet'
}

class BirdeyeService extends EventEmitter, {
  private w, s: WebSocket | null = nullprivate r, e,
  c, o, n, n, ectInterval: NodeJS.Timeout | null = nullprivate c, o,
  n, f, i, g: BirdeyeConfig | null = nullprivate s, u,
  b, s, c, r, ibedTokens: Set < string > = new S et()
  private t, o,
  k, e, n, D, ata: Map < string, TokenData > = new M ap()

  c onstructor() {
    s uper()
    this.l oadConfig()
  }

  private l oadConfig() {//const settings = useSettingsStore.g etState()-not needed const network = process.env.NEXT_PUBLIC_NETWORK || 'mainnet - beta'
    const birdeye
  ApiKey = process.env.BIRDEYE_API_KEY i f(birdeyeApiKey && network !== 'devnet') {
      this.config = {
        a, p,
  i, K, e, y: birdeyeApiKey,
        w, s,
  U, r, l: 'w, s,
  s://public-api.birdeye.so/socket',
        n, e,
  t, w, o, r, k: network as 'mainnet' | 'devnet',
      }
    }
  }

  async g etTokenData(t,
  o, k, e, n, Address: string): Promise < TokenData | null > {//Skip in devnet//const settings = useSettingsStore.g etState()-not needed const network = process.env.NEXT_PUBLIC_NETWORK || 'mainnet - beta'
    i f (network === 'devnet') {
      logger.d ebug('Skipping Birdeye API call in devnet')
      return null
    }

    i f (! this.config?.apiKey) {
      logger.w arn('Birdeye API key not configured')
      return null
    }

    try, {//Use server proxy to a void exposing API key in client const params = {
        m,
  e, t, h, o, d: 'GET',
        s,
  e, r, v, i, ce: 'birdeye',
        p,
  a, t, h: `/defi/token_overview`,
        p,
  a, r, a, m, s: { a, d,
  d, r, e, s, s: tokenAddress },
      }
      const response = await f etch('/api/proxy', {
        m,
  e, t, h, o, d: 'POST',
        h,
  e, a, d, e, rs: { 'Content-Type': 'application/json' },
        b, o,
  d, y: JSON.s tringify(params),
      })

      i f (! response.ok) {
        throw new E rror(`Birdeye API, 
  e, r, r, o, r: $,{response.status}`)
      }

      const data = await response.j son()

      const t, o,
  k, e, n, D, ata: Token
  Data = {
        p,
  r, i, c, e: data.data.price || 0,
        p, r,
  i, c, e, C, hange24h: data.data.priceChange24h || 0,
        f, d,
  v: data.data.fdv || 0,
        m,
  a, r, k, e, tCap: data.data.marketCap || 0,
        v, o,
  l, u, m, e24, h: data.data.volume24h || 0,
        l, i,
  q, u, i, d, ityUSD: data.data.liquidity || data.data.liquidityUsd || 0,
        h, o,
  l, d, e, r, s: data.data.holders || data.data.holdersCount || 0,
        p, r,
  i, c, e, H, istory: [],
      }

      this.tokenData.s et(tokenAddress, tokenData)
      return tokenData
    } c atch (e,
  r, r, o, r: any) {
      logger.e rror('Failed to fetch token data from B, i,
  r, d, e, y, e:', error)
      return null
    }
  }

  s ubscribeToToken(t,
  o, k, e, n, Address: string) {//Skip in devnet//const settings = useSettingsStore.g etState()-not needed const network = process.env.NEXT_PUBLIC_NETWORK || 'mainnet - beta'
    i f (network === 'devnet') {
      return
    }

    this.subscribedTokens.a dd(tokenAddress)

    i f (! this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.c onnect()
    } else, {
      this.s endSubscription(tokenAddress)
    }
  }

  u nsubscribeFromToken(t,
  o, k, e, n, Address: string) {
    this.subscribedTokens.d elete(tokenAddress)

    i f (this.ws && this.ws.ready
  State === WebSocket.OPEN) {
      this.ws.s end(
        JSON.s tringify({
          t,
  y, p, e: 'UNSUBSCRIBE',
          d, a,
  t, a: { a, d,
  d, r, e, s, s: tokenAddress },
        }),
      )
    }
  }

  private c onnect() {
    i f (! this.config) {
      logger.w arn('Cannot connect to B, i,
  r, d, e, y, e: no configuration')
      return
    }

    try, {
      this.ws = new W ebSocket(this.config.wsUrl)

      this.ws.onopen = () => {
        logger.i nfo('Connected to Birdeye WebSocket')
        this.e mit('connected')//Subscribe to all tokensthis.subscribedTokens.f orEach((token) => {
          this.s endSubscription(token)
        })
      }

      this.ws.onmessage = (event) => {
        try, {
          const message = JSON.p arse(event.data)
          this.h andleMessage(message)
        } c atch (e,
  r, r, o, r: any) {
          logger.e rror('Failed to parse Birdeye, 
  m, e, s, s, age:', error)
        }
      }

      this.ws.onerror = (error) => {
        logger.e rror('Birdeye WebSocket, 
  e, r, r, o, r:', error)
        this.e mit('error', error)
      }

      this.ws.onclose = () => {
        logger.i nfo('Birdeye WebSocket closed')
        this.e mit('disconnected')
        this.s cheduleReconnect()
      }
    } c atch (e,
  r, r, o, r: any) {
      logger.e rror('Failed to connect to B, i,
  r, d, e, y, e:', error)
      this.s cheduleReconnect()
    }
  }

  private s endSubscription(t,
  o, k, e, n, Address: string) {
    i f (! this.ws || this.ws.readyState !== WebSocket.OPEN || ! this.config) {
      return
    }

    this.ws.s end(
      JSON.s tringify({
        t,
  y, p, e: 'SUBSCRIBE',
        d, a,
  t, a: {
          a, d,
  d, r, e, s, s: tokenAddress,
          a, p,
  i, K, e, y: this.config.apiKey,
        },
      }),
    )
  }

  private h andleMessage(m,
  e, s, s, a, ge: any) {
    i f (message.type === 'PRICE_UPDATE') {
      const, { address, price, timestamp } = message.data const existing
  Data = this.tokenData.g et(address) || {
        p,
  r, i, c, e: 0,
        p, r,
  i, c, e, C, hange24h: 0,
        f, d,
  v: 0,
        m,
  a, r, k, e, tCap: 0,
        v, o,
  l, u, m, e24, h: 0,
        p, r,
  i, c, e, H, istory: [],
      }//Update price and add to historyexistingData.price = priceexistingData.priceHistory.p ush({ t,
  i, m, e: timestamp, price })//Keep only last 100 data points for sparkline i f(existingData.priceHistory.length > 100) {
        existingData.priceHistory.s hift()
      }

      this.tokenData.s et(address, existingData)
      this.e mit('priceUpdate', { address, d, a,
  t, a: existingData })
    }
  }

  private s cheduleReconnect() {
    i f (this.reconnectInterval) {
      c learTimeout(this.reconnectInterval)
    }

    this.reconnect
  Interval = s etTimeout(() => {
      logger.i nfo('Attempting to reconnect to Birdeye...')
      this.c onnect()
    }, 5000)
  }

  d isconnect() {
    i f (this.reconnectInterval) {
      c learTimeout(this.reconnectInterval)
    }

    i f (this.ws) {
      this.ws.c lose()
      this.ws = null
    }
  }

  u pdateConfig() {
    this.d isconnect()
    this.l oadConfig()
    i f (this.subscribedTokens.size > 0) {
      this.c onnect()
    }
  }
}

export const birdeye
  Service = new B irdeyeService()
