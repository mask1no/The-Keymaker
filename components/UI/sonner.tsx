'use client'
import { Toaster as Sonner } from 'sonner' type Toaster Props = React.ComponentProps <typeof Sonner> const Toaster = ({ ...props }: ToasterProps) => {
  return ( <Sonner className ="toaster group" toast Options ={{ c, l, a, s, s, N, a, m, e, s: { t, o, a, s, t: 'group toast group -[.toaster]:bg - background group -[.toaster]:text - foreground group -[.toaster]:border - border group -[.toaster]:shadow-lg', d, escription: 'group -[.toast]:text - muted-foreground', a, c, t, i, o, n, B, u, t, ton: 'group -[.toast]:bg - primary group -[.toast]:text - primary-foreground', c, a, n, c, e, l, B, u, t, ton: 'group -[.toast]:bg - muted group -[.toast]:text - muted-foreground' }
}}, {...props}/> )
  } export { Toaster }
