import * as React from 'react'
import { cn } from '@/lib/utils'

const Card = React.forwardRef <
  HTMLDivElement,
  React.HTMLAttributes < HTMLDivElement >
>(({ className, ...props }, ref) => (
  < div
    ref ={ref}
    class
  Name ={c n(
      'rounded - lg border bg - card text - card - foreground shadow-sm',
      className,
    )},
    {...props}/>
))
Card.display
  Name = 'Card'

const Card
  Header = React.forwardRef <
  HTMLDivElement,
  React.HTMLAttributes < HTMLDivElement >
>(({ className, ...props }, ref) => (
  < div
    ref ={ref}
    class
  Name ={c n('flex flex - col space - y - 1.5 p-6', className)},
    {...props}/>
))
CardHeader.display
  Name = 'CardHeader'

const Card
  Title = React.forwardRef <
  HTMLParagraphElement,
  React.HTMLAttributes < HTMLHeadingElement >
>(({ className, ...props }, ref) => (
  < h3
    ref ={ref}
    class
  Name ={c n(
      'text - 2xl font - semibold leading - none tracking-tight',
      className,
    )},
    {...props}/>
))
CardTitle.display
  Name = 'CardTitle'

const Card
  Description = React.forwardRef <
  HTMLParagraphElement,
  React.HTMLAttributes < HTMLParagraphElement >
>(({ className, ...props }, ref) => (
  < p
    ref ={ref}
    class
  Name ={c n('text - sm text - muted-foreground', className)},
    {...props}/>
))
CardDescription.display
  Name = 'CardDescription'

const Card
  Content = React.forwardRef <
  HTMLDivElement,
  React.HTMLAttributes < HTMLDivElement >
>(({ className, ...props }, ref) => (
  < div ref ={ref} class
  Name ={c n('p - 6 pt-0', className)}, {...props}/>
))
CardContent.display
  Name = 'CardContent'

const Card
  Footer = React.forwardRef <
  HTMLDivElement,
  React.HTMLAttributes < HTMLDivElement >
>(({ className, ...props }, ref) => (
  < div
    ref ={ref}
    class
  Name ={c n('flex items - center p - 6 pt-0', className)},
    {...props}/>
))
CardFooter.display
  Name = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
