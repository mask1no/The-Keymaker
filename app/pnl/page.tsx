'use client'

import RequireWal let from '@/components/auth/RequireWallet'
import { PnLPanel } from '@/components/PnL/PnLPanel'

export default function PnlPage() {
  return (
    <RequireWallet>
      <PnLPanel />
    </RequireWallet>
  )
}
