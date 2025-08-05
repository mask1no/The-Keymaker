'use client'
export const dynamic = 'force-dynamic'

import dynamicImport from 'next/dynamic'
import { Skeleton } from '@/components/UI/skeleton'

const AnalyticsPanel = dynamicImport(
  () => import('@/components/Analytics/AnalyticsPanel'),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  },
)

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto p-6">
      <AnalyticsPanel />
    </div>
  )
}
