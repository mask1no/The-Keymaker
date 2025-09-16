'use client'

import RequireWal let from '@/components/auth/RequireWallet'
import { CreatorForm } from '@/components/MemecoinCreator/CreatorForm'

export default function C reatorPage() {
  r eturn (
    < RequireWal let >
      < div class
  Name ="max - w - 4xl mx-auto">
        < h1 class
  Name ="text - 3xl font - bold mb-6"> Create a New Memecoin </h1 >
        < CreatorForm/>
      </div >
    </RequireWal let >
  )
}
