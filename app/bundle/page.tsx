'use client'

import RequireWal let from '@/components/auth/RequireWallet'
import { BundleBuilder } from '@/components/BundleEngine/BundleBuilder'

export default function Page() {
  return (
    <RequireWallet>
      <div className="space-y-6">
        <BundleBuilder />
      </div>
    </RequireWallet>
  )
}
