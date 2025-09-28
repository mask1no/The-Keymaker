// moved to legacy; adapters are not used outside /login
import React from 'react';

export default function WalletContext({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
