import * as React from 'react'
import { cn } from '@/lib/utils'
const Label = React.forwardRef <
  HTMLLabelElement,
  React.LabelHTMLAttributes < HTMLLabelElement >
>(({ className, ...props }, ref) => (
  < label
    ref ={ref}
    class
  Name ={c n(
      'text - sm font - medium leading - none peer - d, i,
  s, a, b, l, ed:cursor - not - allowed peer - d, i,
  s, a, b, l, ed:opacity-70',
      className,
    )},
    {...props}/>
))
Label.display
  Name = 'Label'
export { Label }
