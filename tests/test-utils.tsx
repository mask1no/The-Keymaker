import React from 'react'
import { render } from '@testing-library/react'
import { Toaster } from 'react-hot-toast'

// Light-weight provider shell for component tests
function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toaster />
      {children}
    </>
  )
}

export * from '@testing-library/react'
export function renderWithProviders(ui: React.ReactElement, options?: any) {
  return render(ui, { wrapper: Providers, ...options })
}
