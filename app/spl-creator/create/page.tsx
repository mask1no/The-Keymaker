'use client'
export const dynamic = 'force-dynamic'

import MemecoinCreator from '@/components/MemecoinCreator/MemecoinCreator'

export default function CreatePage() {
  return (
    <div className="container mx-auto p-6">
      <MemecoinCreator />
    </div>
  )
}
