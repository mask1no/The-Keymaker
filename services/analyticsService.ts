import { apiClient } from '@/lib/apiClient'
import { logger } from '@/lib/logger'

export type Trade = {
  id: string
  tokenAddress: string
  amount: number
  price: number
  timestamp: string
  wallet: string
  type: 'buy' | 'sell'
}

export type PriceData = {
  sol: number
  eth: number
  btc: number
  cake: number
}

export async function getLivePrices(): Promise<PriceData> {
  try {
    const prices = await apiClient.jupiter.getPrice(
      'So11111111111111111111111111111111111111112,7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs,EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v,CAKEorcFfpMbRqfeYAryJr39mDY6FXYZQgN8yd7Nq5z5',
    )

    return {
      sol: prices['So11111111111111111111111111111111111111112']?.price || 0,
      eth: prices['7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs']?.price || 0,
      btc: prices['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v']?.price || 0,
      cake: prices['CAKEorcFfpMbRqfeYAryJr39mDY6FXYZQgN8yd7Nq5z5']?.price || 0,
    }
  } catch (error) {
    logger.error('Failed to fetch prices', { error })
    return { sol: 0, eth: 0, btc: 0, cake: 0 }
  }
}

export async function exportToCsv(trades: Trade[]): Promise<void> {
  const csv = trades
    .map(
      (t) =>
        `${t.id},${t.tokenAddress},${t.amount},${t.price},${t.timestamp},${t.wallet},${t.type}`,
    )
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'trades.csv'
  a.click()
}
