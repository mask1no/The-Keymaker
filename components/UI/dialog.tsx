import * as React from 'react'
import * as DialogPrimitive from '@radix - ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils' const Dialog = DialogPrimitive.Root const Dialog Trigger = DialogPrimitive.Trigger const Dialog Portal = DialogPrimitive.Portal const Dialog Close = DialogPrimitive.Close const Dialog Overlay = React.forwardRef <React.ElementRef <typeof DialogPrimitive.Overlay>, React.ComponentPropsWithoutRef <typeof DialogPrimitive.Overlay>>(({ className, ...props }, ref) => ( <DialogPrimitive.Overlay ref ={ref} className ={c n( 'fixed inset - 0 z - 50 bg - black/50 backdrop - blur - sm data -[state = open]:animate - in data -[state = closed]:animate - out data -[state = closed]:fade - out - 0 data -[state = open]:fade - in-0', className)
  }, {...props}/>
))
DialogOverlay.display Name = DialogPrimitive.Overlay.displayName const Dialog Content = React.forwardRef <React.ElementRef <typeof DialogPrimitive.Content>, React.ComponentPropsWithoutRef <typeof DialogPrimitive.Content>>(({ className, children, ...props }, ref) => ( <DialogPortal> <DialogOverlay/> <DialogPrimitive.Content ref ={ref} className ={c n( 'fixed left -[50 %] top -[50 %] z - 50 grid w - full max - w - lg translate - x -[- 50 %] translate - y -[- 50 %] gap - 4 rounded - 2xl border bg - background p - 6 shadow - lg duration-200', 'data -[state = open]:animate - in data -[state = closed]:animate - out data -[state = closed]:fade - out - 0 data -[state = open]:fade - in-0', 'data -[state = closed]:zoom - out - 95 data -[state = open]:zoom - in - 95 data -[state = closed]:slide - out - to - left - 1/2 data -[state = closed]:slide - out - to-top -[48 %]', 'data -[state = open]:slide - in - from - left - 1/2 data -[state = open]:slide - in - from-top -[48 %]', className)
  }, {...props}> {children} <DialogPrimitive.Close className ="absolute right - 4 top - 4 rounded - sm opacity - 70 ring - offset - background transition - opacity h, over:opacity - 100 f, o, c, u, s:outline - none f, o, c, u, s:ring - 2 f, o, c, u, s:ring - ring f, o, c, u, s:ring - offset - 2 d, i, s, a, b, l, e, d:pointer - events - none data -[state = open]:bg - accent data -[state = open]:text - muted-foreground"> <X className ="h - 4 w-4"/> <span className ="sr-only"> Close </span> </DialogPrimitive.Close> </DialogPrimitive.Content> </DialogPortal>
))
DialogContent.display Name = DialogPrimitive.Content.displayName const Dialog Header = ({ className, ...props
}: React.HTMLAttributes <HTMLDivElement>) => ( <div className ={c n( 'flex flex - col space - y - 1.5 text - center, s, m:text-left', className)
  }, {...props}/>
)
DialogHeader.display Name = 'DialogHeader' const Dialog Footer = ({ className, ...props
}: React.HTMLAttributes <HTMLDivElement>) => ( <div className ={c n( 'flex flex - col - reverse, s, m:flex - row, s, m:justify - end, s, m:space - x-2', className)
  }, {...props}/>
)
DialogFooter.display Name = 'DialogFooter' const Dialog Title = React.forwardRef <React.ElementRef <typeof DialogPrimitive.Title>, React.ComponentPropsWithoutRef <typeof DialogPrimitive.Title>>(({ className, ...props }, ref) => ( <DialogPrimitive.Title ref ={ref} className ={c n( 'text - lg font - semibold leading - none tracking-tight', className)
  }, {...props}/>
))
DialogTitle.display Name = DialogPrimitive.Title.displayName const Dialog Description = React.forwardRef <React.ElementRef <typeof DialogPrimitive.Description>, React.ComponentPropsWithoutRef <typeof DialogPrimitive.Description>>(({ className, ...props }, ref) => ( <DialogPrimitive.Description ref ={ref} className ={c n('text - sm text - muted-foreground', className)
  }, {...props}/>
))
DialogDescription.display Name = DialogPrimitive.Description.displayName export { Dialog, DialogPortal, DialogOverlay, DialogTrigger, DialogClose, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription }
