import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getBundleStatuses } from '@/lib/server/jitoService'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const regionParam = url.searchParams.get('region') || 'ffm'
  const idsParam = url.searchParams.get('ids') || ''
  const region = z.enum(['ffm', 'ams', 'ny', 'tokyo']).parse(regionParam)
  const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean)
  if (ids.length === 0) {
    return new Response('Missing ids', { status: 400 })
  }
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let active = true
      const interval = 1500
      async function push(data: unknown) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }
      async function loop() {
        while (active) {
          try {
            const statuses = await getBundleStatuses(region as any, ids)
            await push({ region, statuses })
          } catch (e) {
            await push({ error: (e as Error).message })
          }
          await new Promise((r) => setTimeout(r, interval))
        }
      }
      loop()
      // Close after 2 minutes to avoid leaks
      setTimeout(() => {
        active = false
        controller.close()
      }, 120000)
    },
  })
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}


