import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getBundleStatuses } from '@/lib/server/jitoService'
import { isTestMode } from '@/lib/testMode'
import { rateLimit, getRateConfig } from '@/app/api/rate-limit'
import { readJsonSafe, getEnvInt } from '@/lib/server/request'

// Simple 1s in-memory cache to coalesce repeated identical requests
const cache = new Map<string, { at: number; data: any }>()

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0] || 'anon'
    const cfg = getRateConfig('status')
    const rl = rateLimit(`status:${ip}`, cfg.limit, cfg.windowMs)
    if (!rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    const bodySchema = z.object({
      region: z.enum(['ffm', 'ams', 'ny', 'tokyo']).optional(),
      bundle_ids: z.array(z.string().min(1)).min(1).max(getEnvInt('STATUS_MAX_IDS', 20)),
    })
    const body = await readJsonSafe(request, {
      maxBytes: getEnvInt('PAYLOAD_LIMIT_STATUS_BYTES', 16 * 1024),
      schema: bodySchema,
    })
    const region = (body as any).region || 'ffm'
    const idsTyped: string[] = (body as any).bundle_ids.map(String)
    const cacheKey = `${region}:${idsTyped.join(',')}`
    const now = Date.now()
    const hit = cache.get(cacheKey)
    if (hit && now - hit.at < 1000) return NextResponse.json(hit.data)

    if (isTestMode()) {
      const statuses = idsTyped.map((id) => ({
        bundle_id: id,
        confirmation_status: 'landed',
        slot: 123456789,
      }))
      const payload = { region, statuses: statuses.map((s) => ({ ...s, status: s.confirmation_status, landed_slot: s.slot })) }
      cache.set(cacheKey, { at: now, data: payload })
      return NextResponse.json(payload)
    }

    const raw = await getBundleStatuses(region, idsTyped)
    // Provide a stable, UI-friendly shape while preserving original fields
    const statuses = raw.map((s) => ({
      ...s,
      status: s.confirmation_status,
      landed_slot: typeof s.slot === 'number' ? s.slot : null,
    }))
    const payload = { region, statuses }
    cache.set(cacheKey, { at: now, data: payload })
    return NextResponse.json(payload)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
