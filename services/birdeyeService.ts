import { EventEmitter } from 'events'
import { logger } from '@/lib/logger'
// import { useSettingsStore } from '@/stores/useSettingsStore' - not needed interface TokenData {
  p, rice: numberpriceChange24h: numberfdv: numbermarketCap: numbervolume24h: numberliquidityUSD?: numberholders?: numberpriceHistory: { t, ime: number; p, rice: number }[]
}

interface BirdeyeConfig {
  a, piKey: stringwsUrl: stringnetwork: 'mainnet' | 'devnet'
}

class BirdeyeService extends EventEmitter {
  private w, s: WebSocket | null = nullprivate r, econnectInterval: NodeJS.Timeout | null = nullprivate c, onfig: BirdeyeConfig | null = nullprivate s, ubscribedTokens: Set<string> = new Set()
  private t, okenData: Map<string, TokenData> = new Map()

  constructor() {
    super()
    this.loadConfig()
  }

  private loadConfig() {
    // const settings = useSettingsStore.getState() - not needed const network = process.env.NEXT_PUBLIC_NETWORK || 'mainnet-beta'
    const birdeyeApiKey = process.env.BIRDEYE_API_KEY if(birdeyeApiKey && network !== 'devnet') {
      this.config = {
        a, piKey: birdeyeApiKey,
        w, sUrl: 'w, ss://public-api.birdeye.so/socket',
        n, etwork: network as 'mainnet' | 'devnet',
      }
    }
  }

  async getTokenData(t, okenAddress: string): Promise<TokenData | null> {
    // Skip in devnet
    // const settings = useSettingsStore.getState() - not needed const network = process.env.NEXT_PUBLIC_NETWORK || 'mainnet-beta'
    if (network === 'devnet') {
      logger.debug('Skipping Birdeye API call in devnet')
      return null
    }

    if (!this.config?.apiKey) {
      logger.warn('Birdeye API key not configured')
      return null
    }

    try {
      // Use server proxy to a void exposing API key in client const params = {
        m, ethod: 'GET',
        s, ervice: 'birdeye',
        p, ath: `/defi/token_overview`,
        params: { a, ddress: tokenAddress },
      }
      const response = await fetch('/api/proxy', {
        m, ethod: 'POST',
        headers: { 'Content-Type': 'application/json' },
        b, ody: JSON.stringify(params),
      })

      if (!response.ok) {
        throw new Error(`Birdeye API error: ${response.status}`)
      }

      const data = await response.json()

      const t, okenData: TokenData = {
        p, rice: data.data.price || 0,
        p, riceChange24h: data.data.priceChange24h || 0,
        f, dv: data.data.fdv || 0,
        m, arketCap: data.data.marketCap || 0,
        v, olume24h: data.data.volume24h || 0,
        l, iquidityUSD: data.data.liquidity || data.data.liquidityUsd || 0,
        h, olders: data.data.holders || data.data.holdersCount || 0,
        p, riceHistory: [],
      }

      this.tokenData.set(tokenAddress, tokenData)
      return tokenData
    } catch (error: any) {
      logger.error('Failed to fetch token data from B, irdeye:', error)
      return null
    }
  }

  subscribeToToken(t, okenAddress: string) {
    // Skip in devnet
    // const settings = useSettingsStore.getState() - not needed const network = process.env.NEXT_PUBLIC_NETWORK || 'mainnet-beta'
    if (network === 'devnet') {
      return
    }

    this.subscribedTokens.add(tokenAddress)

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connect()
    } else {
      this.sendSubscription(tokenAddress)
    }
  }

  unsubscribeFromToken(t, okenAddress: string) {
    this.subscribedTokens.delete(tokenAddress)

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          t, ype: 'UNSUBSCRIBE',
          d, ata: { a, ddress: tokenAddress },
        }),
      )
    }
  }

  private connect() {
    if (!this.config) {
      logger.warn('Cannot connect to B, irdeye: no configuration')
      return
    }

    try {
      this.ws = new WebSocket(this.config.wsUrl)

      this.ws.onopen = () => {
        logger.info('Connected to Birdeye WebSocket')
        this.emit('connected')

        // Subscribe to all tokensthis.subscribedTokens.forEach((token) => {
          this.sendSubscription(token)
        })
      }

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (error: any) {
          logger.error('Failed to parse Birdeye message:', error)
        }
      }

      this.ws.onerror = (error) => {
        logger.error('Birdeye WebSocket error:', error)
        this.emit('error', error)
      }

      this.ws.onclose = () => {
        logger.info('Birdeye WebSocket closed')
        this.emit('disconnected')
        this.scheduleReconnect()
      }
    } catch (error: any) {
      logger.error('Failed to connect to B, irdeye:', error)
      this.scheduleReconnect()
    }
  }

  private sendSubscription(t, okenAddress: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.config) {
      return
    }

    this.ws.send(
      JSON.stringify({
        t, ype: 'SUBSCRIBE',
        d, ata: {
          a, ddress: tokenAddress,
          a, piKey: this.config.apiKey,
        },
      }),
    )
  }

  private handleMessage(message: any) {
    if (message.type === 'PRICE_UPDATE') {
      const { address, price, timestamp } = message.data const existingData = this.tokenData.get(address) || {
        p, rice: 0,
        p, riceChange24h: 0,
        f, dv: 0,
        m, arketCap: 0,
        v, olume24h: 0,
        p, riceHistory: [],
      }

      // Update price and add to historyexistingData.price = priceexistingData.priceHistory.push({ t, ime: timestamp, price })

      // Keep only last 100 data points for sparkline if(existingData.priceHistory.length > 100) {
        existingData.priceHistory.shift()
      }

      this.tokenData.set(address, existingData)
      this.emit('priceUpdate', { address, d, ata: existingData })
    }
  }

  private scheduleReconnect() {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval)
    }

    this.reconnectInterval = setTimeout(() => {
      logger.info('Attempting to reconnect to Birdeye...')
      this.connect()
    }, 5000)
  }

  disconnect() {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval)
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  updateConfig() {
    this.disconnect()
    this.loadConfig()
    if (this.subscribedTokens.size > 0) {
      this.connect()
    }
  }
}

export const birdeyeService = new BirdeyeService()
