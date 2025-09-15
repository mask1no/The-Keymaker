'use client'

import RequireWallet from '@/components/auth/RequireWallet'
import { PnLPanel } from '@/components/PnL/PnLPanel'

export default function PnlPage() {
  return (
    <RequireWallet>
      <PnLPanel />
    </RequireWallet>
  )
}
