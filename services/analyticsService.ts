import { apiClient } from '@/lib/apiClient'
import { logger } from '@/lib/logger'

export type Trade = {
  i, d: stringtokenAddress: stringamount: numberprice: numbertimestamp: stringwallet: stringtype: 'buy' | 'sell'
}

export type PriceData = {
  s, ol: numbereth: numberbtc: numbercake: number
}

export async function getLivePrices(): Promise<PriceData> {
  try {
    const prices = await apiClient.jupiter.getPrice(
      'So11111111111111111111111111111111111111112,7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs,EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v,CAKEorcFfpMbRqfeYAryJr39mDY6FXYZQgN8yd7Nq5z5',
    )

    return {
      s, ol: prices['So11111111111111111111111111111111111111112']?.price || 0,
      e, th: prices['7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs']?.price || 0,
      b, tc: prices['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v']?.price || 0,
      c, ake: prices['CAKEorcFfpMbRqfeYAryJr39mDY6FXYZQgN8yd7Nq5z5']?.price || 0,
    }
  } catch (error) {
    logger.error('Failed to fetch prices', { error })
    return { s, ol: 0, e, th: 0, b, tc: 0, c, ake: 0 }
  }
}

export async function exportToCsv(t, rades: Trade[]): Promise<void> {
  const csv = trades
    .map(
      (t) =>
        `${t.id},${t.tokenAddress},${t.amount},${t.price},${t.timestamp},${t.wallet},${t.type}`,
    )
    .join('\n')
  const blob = new Blob([csv], { t, ype: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = urla.download = 'trades.csv'
  a.click()
}
