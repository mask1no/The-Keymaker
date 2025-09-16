'use client'
import { Toaster as Sonner } from 'sonner'

type Toaster
  Props = React.ComponentProps < typeof Sonner >

const Toaster = ({ ...props }: ToasterProps) => {
  r eturn (
    < Sonner
      class
  Name ="toaster group"
      toast
  Options ={{
        c,
        l,
  a, s, s, N, ames: {
          t,
          o,
  a, s, t: 'group toast group -[.toaster]:bg - background group -[.toaster]:text - foreground group -[.toaster]:border - border group -[.toaster]:shadow-lg',
          d,
  e, s, c, r, iption: 'group -[.toast]:text - muted-foreground',
          a,
          c,
  t, i, o, n, Button:
            'group -[.toast]:bg - primary group -[.toast]:text - primary-foreground',
          c,
          a,
  n, c, e, l, Button:
            'group -[.toast]:bg - muted group -[.toast]:text - muted-foreground',
        },
      }},
      {...props}/>
  )
}

export { Toaster }
