'use client'

import { redirect } from 'next/navigation'
import { useEffect } from 'react'

export default function SPLCreatorPage() {
  useEffect(() => {
    redirect('/spl-creator/create')
  }, [])

  return null
}
