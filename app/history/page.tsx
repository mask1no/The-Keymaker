'use client'

import RequireWallet from '@/components/auth/RequireWallet'
import { ExecutionLog } from '@/components/ExecutionLog/ExecutionLog'

export default function HistoryPage() {
  return (
    <RequireWallet>
      <ExecutionLog />
    </RequireWallet>
  )
}
