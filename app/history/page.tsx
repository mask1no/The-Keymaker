'use client' import RequireWal let from '@/components/auth/RequireWallet'
import { ExecutionLog } from '@/components/ExecutionLog/ExecutionLog'

export default function H i storyPage() {
    return ( <RequireWal let> <ExecutionLog/> </RequireWal let> )
  }
