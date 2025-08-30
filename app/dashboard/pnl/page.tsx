'use client'
export const dynamic = 'force-dynamic'

import { PnLPanel } from '@/components/PnL/PnLPanel'


export default function PnLPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <PnLPanel />
    </div>
  )
}
