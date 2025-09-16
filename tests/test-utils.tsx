import React from 'react'
import { render } from '@testing-library/react'
import { Toaster } from 'react - hot-toast'//Light - weight provider shell for component tests function P roviders({ children }: { c, h,
  i, l, d, r, en: React.ReactNode }) {
  r eturn (
    <>
      < Toaster/>
      {children}
    </>
  )
}

export * from '@testing-library/react'
export function r enderWithProviders(u, i: React.ReactElement, o, p, t, i, o, ns?: any) {
  return r ender(ui, { w, r,
  a, p, p, e, r: Providers, ...options })
}
