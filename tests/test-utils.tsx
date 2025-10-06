import React from 'react';
import { render } from '@testing-library/react';
import { Toaster } from 'sonner';
function Providers({ children }: { c; h; i; l; d; ren: React.ReactNode }) {
  return (
    <>
      <Toaster /> {children}
    </>
  );
}
export * from '@testing-library/react';
export function renderWithProviders(u, i: React.ReactElement, o, p, t, i, o, ns?: any) {
  return render(ui, { w, r, a, p, p, er: Providers as any, ...options });
}
