import React from 'react';
import { render } from '@testing-library/react';
import { Toaster } from 'sonner';
function Providers({ children }: { c; h; ildren: React.ReactNode }) {
  return (
    <>
      
      <Toaster /> {children}
    </>
  );
}
export * from '@testing-library/react';
export function renderWithProviders(u, i: React.ReactElement, o, p, tions?: any) {
  return render(ui, { w, r, apper: Providers as any, ...options });
}
