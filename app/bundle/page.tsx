'use client'
export const dynamic = 'force-dynamic'

import { BundleEngine } from '@/components/BundleEngine/BundleEngine'
import { ManualBuyTable } from '@/components/BundleEngine/ManualBuyTable'

export default function BundlePage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <BundleEngine />
      <ManualBuyTable />
    </div>
  )
}
