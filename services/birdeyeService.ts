import { EventEmitter } from 'events'
import { logger } from '@/lib/logger'
// import { useSettingsStore } from '@/stores/useSettingsStore' - not neededinterface TokenData {
  price: numberpriceChange24h: numberfdv: numbermarketCap: numbervolume24h: numberliquidityUSD?: numberholders?: numberpriceHistory: { time: number; price: number }[]
}

interface BirdeyeConfig {
  apiKey: stringwsUrl: stringnetwork: 'mainnet' | 'devnet'
}

class BirdeyeService extends EventEmitter {
  private ws: WebSocket | null = nullprivate reconnectInterval: NodeJS.Timeout | null = nullprivate config: BirdeyeConfig | null = nullprivate subscribedTokens: Set<string> = new Set()
  private tokenData: Map<string, TokenData> = new Map()

  constructor() {
    super()
    this.loadConfig()
  }

  private loadConfig() {
    // const settings = useSettingsStore.getState() - not neededconst network = process.env.NEXT_PUBLIC_NETWORK || 'mainnet-beta'
    const birdeyeApiKey = process.env.BIRDEYE_API_KEYif (birdeyeApiKey && network !== 'devnet') {
      this.config = {
        apiKey: birdeyeApiKey,
        wsUrl: 'wss://public-api.birdeye.so/socket',
        network: network as 'mainnet' | 'devnet',
      }
    }
  }

  async getTokenData(tokenAddress: string): Promise<TokenData | null> {
    // Skip in devnet
    // const settings = useSettingsStore.getState() - not neededconst network = process.env.NEXT_PUBLIC_NETWORK || 'mainnet-beta'
    if (network === 'devnet') {
      logger.debug('Skipping Birdeye API call in devnet')
      return null
    }

    if (!this.config?.apiKey) {
      logger.warn('Birdeye API key not configured')
      return null
    }

    try {
      // Use server proxy to avoid exposing API key in clientconst params = {
        method: 'GET',
        service: 'birdeye',
        path: `/defi/token_overview`,
        params: { address: tokenAddress },
      }
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        throw new Error(`Birdeye API error: ${response.status}`)
      }

      const data = await response.json()

      const tokenData: TokenData = {
        price: data.data.price || 0,
        priceChange24h: data.data.priceChange24h || 0,
        fdv: data.data.fdv || 0,
        marketCap: data.data.marketCap || 0,
        volume24h: data.data.volume24h || 0,
        liquidityUSD: data.data.liquidity || data.data.liquidityUsd || 0,
        holders: data.data.holders || data.data.holdersCount || 0,
        priceHistory: [],
      }

      this.tokenData.set(tokenAddress, tokenData)
      return tokenData
    } catch (error: any) {
      logger.error('Failed to fetch token data from Birdeye:', error)
      return null
    }
  }

  subscribeToToken(tokenAddress: string) {
    // Skip in devnet
    // const settings = useSettingsStore.getState() - not neededconst network = process.env.NEXT_PUBLIC_NETWORK || 'mainnet-beta'
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

  unsubscribeFromToken(tokenAddress: string) {
    this.subscribedTokens.delete(tokenAddress)

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'UNSUBSCRIBE',
          data: { address: tokenAddress },
        }),
      )
    }
  }

  private connect() {
    if (!this.config) {
      logger.warn('Cannot connect to Birdeye: no configuration')
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
      logger.error('Failed to connect to Birdeye:', error)
      this.scheduleReconnect()
    }
  }

  private sendSubscription(tokenAddress: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.config) {
      return
    }

    this.ws.send(
      JSON.stringify({
        type: 'SUBSCRIBE',
        data: {
          address: tokenAddress,
          apiKey: this.config.apiKey,
        },
      }),
    )
  }

  private handleMessage(message: any) {
    if (message.type === 'PRICE_UPDATE') {
      const { address, price, timestamp } = message.dataconst existingData = this.tokenData.get(address) || {
        price: 0,
        priceChange24h: 0,
        fdv: 0,
        marketCap: 0,
        volume24h: 0,
        priceHistory: [],
      }

      // Update price and add to historyexistingData.price = priceexistingData.priceHistory.push({ time: timestamp, price })

      // Keep only last 100 data points for sparklineif (existingData.priceHistory.length > 100) {
        existingData.priceHistory.shift()
      }

      this.tokenData.set(address, existingData)
      this.emit('priceUpdate', { address, data: existingData })
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
