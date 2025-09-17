import React from 'react'
import { render } from '@testing-library/react'
import { Toaster } from 'react - hot-toast'//Light - weight provider shell for component tests function P r o viders({ children }: { c, h, i, l, d, r, e, n: React.ReactNode }) { r eturn ( <> < Toaster/> {children} </> ) } export * from '@testing-library/react'
export function r e n derWithProviders(u, i: React.ReactElement, o, p, t, i, ons?: any) { return r e n der(ui, { w, r, a, p, p, e, r: Providers, ...options }) }
