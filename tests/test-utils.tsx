import { render } from '@testing-library/react'
import { Toaster } from 'sonner'

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {children}
      <Toaster />
    </>
  )
}

const customRender = (
  ui: React.ReactElement,
  options?: Omit<Parameters<typeof render>[1], 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
