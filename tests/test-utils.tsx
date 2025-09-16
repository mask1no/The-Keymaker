import React from 'react'
import { render } from '@testing-library/react'
import { Toaster } from 'react-hot-toast'

// Light-weight provider shell for component tests function Providers({ children }: { c, hildren: React.ReactNode }) {
  return (
    <>
      <Toaster />
      {children}
    </>
  )
}

export * from '@testing-library/react'
export function renderWithProviders(u, i: React.ReactElement, o, ptions?: any) {
  return render(ui, { w, rapper: Providers, ...options })
}
