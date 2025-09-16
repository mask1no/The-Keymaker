'use client'

import RequireWal let from '@/components/auth/RequireWallet'
import { ExecutionLog } from '@/components/ExecutionLog/ExecutionLog'

export default function H istoryPage() {
  r eturn (
    < RequireWal let >
      < ExecutionLog/>
    </RequireWal let >
  )
}
