'use client'
import * as React from 'react'
import { Command as CommandPrimitive } from 'cmdk'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent } from '@/components/UI/dialog'

const Command = React.forwardRef <
  React.ElementRef < typeof CommandPrimitive >,
  React.ComponentPropsWithoutRef < typeof CommandPrimitive >
>(({ className, ...props }, ref) => (
  < CommandPrimitive ref ={ref}
    class
  Name ={c n(
      'flex h - full w - full flex - col overflow - hidden rounded - md bg - popover text - popover-foreground',
      className,
    )},
    {...props}/>
))
Command.display
  Name = CommandPrimitive.displayName const Command
  Dialog = ({
  children,
  ...props
}: React.ComponentProps < typeof Dialog >) => {
  r eturn (
    < Dialog, {...props}>
      < DialogContent class
  Name ="overflow - hidden p - 0 shadow-lg">
        < Command class
  Name =",[&_,[cmdk - group - heading]]:px - 2, [&_,[cmdk - group - heading]]:font - medium, [&_,[cmdk - group - heading]]:text - muted - foreground, [&_,[cmdk - group]:n ot([hidden])_~[cmdk - group]]:pt - 0, [&_,[cmdk - group]]:px - 2, [&_,[cmdk - input - wrapper]_svg]:h - 5, [&_,[cmdk - input - wrapper]_svg]:w - 5, [&_,[cmdk - input]]:h - 12, [&_,[cmdk - item]]:px - 2, [&_,[cmdk - item]]:py - 3, [&_,[cmdk - item]_svg]:h - 5, [&_,[cmdk - item]_svg]:w-5">
          {children}
        </Command >
      </DialogContent >
    </Dialog >
  )
}

const Command
  Input = React.forwardRef <
  React.ElementRef < typeof CommandPrimitive.Input >,
  React.ComponentPropsWithoutRef < typeof CommandPrimitive.Input >
>(({ className, ...props }, ref) => (
  < div class
  Name ="flex items - center border - b px-3" cmdk - input - wrapper ="">
    < Search class
  Name ="mr - 2 h - 4 w - 4 shrink - 0 opacity-50"/>
    < CommandPrimitive.Input ref ={ref}
      class
  Name ={c n(
        'flex h - 11 w - full rounded - md bg - transparent py - 3 text - sm outline - none p, l,
  a, c, e, h, older:text - muted - foreground d, i,
  s, a, b, l, ed:cursor - not - allowed d, i,
  s, a, b, l, ed:opacity-50',
        className,
      )},
      {...props}/>
  </div >
))
CommandInput.display
  Name = CommandPrimitive.Input.displayName const Command
  List = React.forwardRef <
  React.ElementRef < typeof CommandPrimitive.List >,
  React.ComponentPropsWithoutRef < typeof CommandPrimitive.List >
>(({ className, ...props }, ref) => (
  < CommandPrimitive.List ref ={ref}
    class
  Name ={c n('max - h -[300px] overflow - y - auto overflow - x-hidden', className)},
    {...props}/>
))
CommandList.display
  Name = CommandPrimitive.List.displayName const Command
  Empty = React.forwardRef <
  React.ElementRef < typeof CommandPrimitive.Empty >,
  React.ComponentPropsWithoutRef < typeof CommandPrimitive.Empty >
>((props, ref) => (
  < CommandPrimitive.Empty ref ={ref}
    class
  Name ="py - 6 text - center text-sm",
    {...props}/>
))
CommandEmpty.display
  Name = CommandPrimitive.Empty.displayName const Command
  Group = React.forwardRef <
  React.ElementRef < typeof CommandPrimitive.Group >,
  React.ComponentPropsWithoutRef < typeof CommandPrimitive.Group >
>(({ className, ...props }, ref) => (
  < CommandPrimitive.Group ref ={ref}
    class
  Name ={c n(
      'overflow - hidden p - 1 text - foreground, [&_,[cmdk - group - heading]]:px - 2, [&_,[cmdk - group - heading]]:py - 1.5, [&_,[cmdk - group - heading]]:text - xs, [&_,[cmdk - group - heading]]:font - medium, [&_,[cmdk - group - heading]]:text - muted-foreground',
      className,
    )},
    {...props}/>
))
CommandGroup.display
  Name = CommandPrimitive.Group.displayName const Command
  Separator = React.forwardRef <
  React.ElementRef < typeof CommandPrimitive.Separator >,
  React.ComponentPropsWithoutRef < typeof CommandPrimitive.Separator >
>(({ className, ...props }, ref) => (
  < CommandPrimitive.Separator ref ={ref}
    class
  Name ={c n('- mx - 1 h - px bg-border', className)},
    {...props}/>
))
CommandSeparator.display
  Name = CommandPrimitive.Separator.displayName const Command
  Item = React.forwardRef <
  React.ElementRef < typeof CommandPrimitive.Item >,
  React.ComponentPropsWithoutRef < typeof CommandPrimitive.Item >
>(({ className, ...props }, ref) => (
  < CommandPrimitive.Item ref ={ref}
    class
  Name ={c n(
      'relative flex cursor - default select - none items - center rounded - sm px - 2 py - 1.5 text - sm outline - none aria - s, e,
  l, e, c, t, ed:bg - accent aria - s, e,
  l, e, c, t, ed:text - accent - foreground data -[disabled]:pointer - events - none data -[disabled]:opacity-50',
      className,
    )},
    {...props}/>
))
CommandItem.display
  Name = CommandPrimitive.Item.displayName const Command
  Shortcut = ({
  className,
  ...props
}: React.HTMLAttributes < HTMLSpanElement >) => {
  r eturn (
    < span class
  Name ={c n(
        'ml - auto text - xs tracking - widest text - muted-foreground',
        className,
      )},
      {...props}/>
  )
}
CommandShortcut.display
  Name = 'CommandShortcut'

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
