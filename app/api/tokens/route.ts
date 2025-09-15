import { NextRequest, NextResponse } from 'next/server'
import 'server-only'
import path from 'path'
import { Keypair } from '@solana/web3.js'
import { createToken, CreateTokenParams } from '@/services/tokenService'
import { launchToken } from '@/services/platformService'
import { getConnection } from '@/lib/network'

// SECURITY WARNING: This endpoint uses server-side signing which is NOT production-safe
// TODO: Convert to client-side signing where server returns unsigned transactions
// Only enable this in development/testing environments
const IS_DEV_MODE =
  process.env.NODE_ENV === 'development' ||
  process.env.ENABLE_DEV_TOKENS === 'true'

if (!IS_DEV_MODE) {
  throw new Error(
    'Token creation endpoint is disabled in production for security reasons',
  )
}

// In a real app, you'd get this from a secure source
const MOCK_WALLET_SECRET = process.env.SMOKE_SECRET
if (!MOCK_WALLET_SECRET) {
  throw new Error('SMOKE_SECRET environment variable not set!')
}
const wallet = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(MOCK_WALLET_SECRET)),
)

async function saveTokenToDb(
  address: string,
  name: string,
  symbol: string,
  supply: number,
  decimals: number,
  launch_platform: string,
  metadata: any,
) {
  const dbPath = path.join(process.cwd(), 'data', 'keymaker.db')
  const sqlite3 = (await import('sqlite3')).default
  const { open } = await import('sqlite')
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  })

  await db.run(
    `INSERT INTO tokens (address, name, symbol, supply, decimals, launch_platform, metadata) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      address,
      name,
      symbol,
      supply,
      decimals,
      launch_platform,
      metadata ? JSON.stringify(metadata) : null,
    ],
  )
  await db.close()
}

export async function POST(request: NextRequest) {
  try {
    // Using formData to handle file uploads
    const formData = await request.formData()
    const name = formData.get('name') as string
    const symbol = formData.get('symbol') as string
    const supply = Number(formData.get('supply'))
    const decimals = Number(formData.get('decimals'))
    const launch_platform = formData.get('launch_platform') as
      | 'pump.fun'
      | 'raydium'
    const description = formData.get('description') as string
    const imageFile = formData.get('image') as File | null
    const createLiquidityPool = formData.get('createLiquidityPool') === 'true'
    const solAmount = Number(formData.get('solAmount'))
    const tokenAmount = Number(formData.get('tokenAmount'))

    const metadata = {
      description,
      // In a real implementation, you'd handle other metadata fields
    }

    if (
      !name ||
      !symbol ||
      isNaN(supply) ||
      isNaN(decimals) ||
      !launch_platform
    ) {
      return NextResponse.json(
        { error: 'Missing or invalid required fields' },
        { status: 400 },
      )
    }

    if (!imageFile) {
      return NextResponse.json(
        { error: 'Token image is required' },
        { status: 400 },
      )
    }

    if (
      createLiquidityPool &&
      (isNaN(solAmount) ||
        isNaN(tokenAmount) ||
        solAmount <= 0 ||
        tokenAmount <= 0)
    ) {
      return NextResponse.json(
        {
          error:
            'Valid SOL and Token amounts are required for the liquidity pool.',
        },
        { status: 400 },
      )
    }

    const imageBuffer = Buffer.from(await imageFile.arrayBuffer())

    if (createLiquidityPool) {
      // Use platformService to handle token creation and liquidity pool in one go
      const connection = getConnection()
      const { token: tokenInfo, liquidity: liquidityInfo } = await launchToken(
        connection,
        wallet,
        {
          name,
          symbol,
          supply,
          decimals,
          description,
          imageUrl: '',
          twitter: '',
          telegram: '',
          website: '',
        },
        { platform: launch_platform, solAmount, tokenAmount },
      )

      // Save token to DB
      await saveTokenToDb(
        tokenInfo.mintAddress,
        name,
        symbol,
        supply,
        decimals,
        launch_platform,
        { description, image: imageBuffer },
      )

      return NextResponse.json({
        success: true,
        tokenAddress: tokenInfo.mintAddress,
        poolAddress: liquidityInfo.poolAddress,
        transactionSignature: liquidityInfo.txSignature,
      })
    } else {
      // Just create the token
      const tokenParams: CreateTokenParams = {
        name,
        symbol,
        supply,
        decimals,
        description,
        image: imageBuffer,
        wallet, // Using a mock wallet for now
      }
      const tokenAddress = await createToken(tokenParams)

      // Save token to our database
      await saveTokenToDb(
        tokenAddress,
        name,
        symbol,
        supply,
        decimals,
        launch_platform,
        metadata,
      )
      return NextResponse.json({ success: true, tokenAddress })
    }
  } catch (error) {
    console.error('Failed to create token:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred'
    return NextResponse.json(
      { error: `Failed to create token: ${errorMessage}` },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const dbPath = path.join(process.cwd(), 'data', 'keymaker.db')
    const sqlite3 = (await import('sqlite3')).default
    const { open } = await import('sqlite')
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    const tokens = await db.all('SELECT * FROM tokens ORDER BY id DESC')
    await db.close()

    return NextResponse.json({ tokens })
  } catch (error) {
    console.error('Failed to fetch tokens:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tokens from database' },
      { status: 500 },
    )
  }
}
