import { NextResponse } from 'next/server'
import { searcherClient } from 'jito-ts/dist/sdk/block-engine/searcher'
import { Jito_regions } from '@/lib/server/jitoService'

export async function GET() {
  try {
    const clients = Jito_regions.map((url) => searcherClient(url, undefined as any))
    
    // For simplicity, we'll just use the first client/region.
    // A more robust implementation would check multiple regions.
    const client = clients[0]

    const tipStream = await new Promise<any[]>((resolve) => {
      const tips: any[] = []
      client.onBundleResult(
        (bundle) => {
          // Not used for this purpose
        },
        (error) => {
          console.error('Error from tip stream:', error)
        },
      )
      client.onAccountUpdate(
        (account, isStartup) => {
          // Not used for this purpose
        },
        (error) => {
            console.error('Error from account stream:', error)
        }
      )
      
      const tipListener = client.onTipStream((tips) => {
        resolve(tips);
        tipListener.close(); // Close the listener after receiving the first batch of tips
      });

    })

    return NextResponse.json(tipStream)
  } catch (error) {
    console.error('Failed to get Jito tip stream:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Jito tip stream' },
      { status: 500 },
    )
  }
}
