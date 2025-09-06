import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      name,
      symbol,
      supply,
      metadata,
      enableBundling,
      buyAmount,
      mode,
      delay_seconds
    } = body || {}

    if (!name || !symbol || !supply) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      )
    }

    const svc = await import('@/services/pumpfunService')
    const result = await svc.createToken(
      name,
      symbol,
      Number(supply),
      metadata || {},
    )

    // If bundling is enabled, create and submit bundle
    if (enableBundling && buyAmount > 0) {
      try {
        // Import the bundle service
        const bundleSvc = await import('@/services/bundleService')

        // Create a buy transaction for the new token
        const buyTx = await bundleSvc.createBuyTransaction(
          result,
          buyAmount,
          mode || 'regular',
          delay_seconds || 0
        )

        // Submit the bundle
        const bundleResult = await bundleSvc.submitBundleWithMode(
          [buyTx],
          mode || 'regular',
          delay_seconds || 0
        )

        return NextResponse.json({
          mint: result,
          bundleId: bundleResult.bundleId,
          mode: mode || 'regular',
          delay: delay_seconds || 0,
          buyAmount
        }, { status: 200 })

      } catch (bundleError: any) {
        // Token was created but bundling failed - still return success with token
        console.error('Bundling failed:', bundleError)
        return NextResponse.json({
          mint: result,
          bundleError: bundleError.message,
          note: 'Token created but bundling failed'
        }, { status: 200 })
      }
    }

    return NextResponse.json({ mint: result }, { status: 200 })
  } catch (error: any) {
    Sentry.captureException(error)
    return NextResponse.json(
      { error: error?.message || 'Pump.fun launch failed' },
      { status: 500 },
    )
  }
}
