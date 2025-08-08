// Resolve Helius RPC with sensible fallbacks
// Priority: NEXT_PUBLIC_HELIUS_RPC > HELIUS_API_KEY-composed URL > public devnet RPC
export const NEXT_PUBLIC_HELIUS_RPC =
  process.env.NEXT_PUBLIC_HELIUS_RPC ||
  (process.env.HELIUS_API_KEY
    ? `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`
    : 'https://api.devnet.solana.com')

// Resolve Jito endpoint with fallback to well-known public endpoint
// Priority: NEXT_PUBLIC_JITO_ENDPOINT > JITO_RPC_URL > default public mainnet block engine
export const NEXT_PUBLIC_JITO_ENDPOINT =
  process.env.NEXT_PUBLIC_JITO_ENDPOINT ||
  process.env.JITO_RPC_URL ||
  'https://mainnet.block-engine.jito.wtf'

// Birdeye api key (used client-side in some flows)
export const NEXT_PUBLIC_BIRDEYE_API_KEY =
  process.env.NEXT_PUBLIC_BIRDEYE_API_KEY || process.env.BIRDEYE_API_KEY || ''
export const NEXT_PUBLIC_JUPITER_API_URL = 'https://quote-api.jup.ag/v6'
export const NEXT_PUBLIC_PUMP_API_URL = 'https://pumpportal.fun/api'
export const JITO_TIP_ACCOUNTS = [
  '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
  'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
  'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
  'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
  'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh',
  'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt',
  'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL',
  '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT',
]

// Solana native mint (SOL)
export const SOL_MINT_ADDRESS = 'So11111111111111111111111111111111111111112'
