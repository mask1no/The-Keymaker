'use client'
export const dynamic = 'force-dynamic'

import { SellMonitor } from '@/components/SellMonitor/SellMonitor'


export default function SellMonitorPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <SellMonitor />
    </div>
  )
}
