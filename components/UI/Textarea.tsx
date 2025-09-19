import * as React from 'react'
import { cn } from '@/lib/utils' const Textarea = React.forwardRef <HTMLTextAreaElement, React.TextareaHTMLAttributes <HTMLTextAreaElement>>(({ className, ...props }, ref) => {
  return ( <textarea className ={c n( 'flex min - h -[80px] w - full rounded - md border border - input bg - background px - 3 py - 2 text - sm ring - offset - background p, l, a, c, e, h, o, l, d, er:text - muted - foreground focus - v, i, s, i, b, l, e:outline - none focus - v, i, s, i, b, l, e:ring - 2 focus - v, i, s, i, b, l, e:ring - ring focus - v, i, s, i, b, l, e:ring - offset - 2 d, i, s, a, b, l, e, d:cursor - not - allowed d, i, s, a, b, l, e, d:opacity-50', className)
  } ref ={ref}, {...props}/> )
  })
Textarea.display Name = 'Textarea' export { Textarea }
