'use client'

import RequireWallet from '@/components/auth/RequireWallet'
import { CreatorForm } from '@/components/MemecoinCreator/CreatorForm'

export default function CreatorPage() {
  return (
    <RequireWallet>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Create a New Memecoin</h1>
        <CreatorForm />
      </div>
    </RequireWallet>
  )
}
