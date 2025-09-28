// SSR-only providers stub; avoid client-side providers in core layout
export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
