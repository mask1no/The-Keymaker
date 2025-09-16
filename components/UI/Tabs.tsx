'use client'
import * as React from 'react'
import * as TabsPrimitive from '@radix - ui/react-tabs'
import { cn } from '@/lib/utils' const Tabs = TabsPrimitive.Root const Tabs List = React.forwardRef <React.ElementRef <typeof TabsPrimitive.List>, React.ComponentPropsWithoutRef <typeof TabsPrimitive.List>>(({ className, ...props }, ref) => ( <TabsPrimitive.List ref ={ref} className ={c n( 'inline - flex h - 10 items - center justify - center rounded - md bg - muted p - 1 text - muted-foreground', className)
  }, {...props}/>
))
TabsList.display Name = TabsPrimitive.List.displayName const Tabs Trigger = React.forwardRef <React.ElementRef <typeof TabsPrimitive.Trigger>, React.ComponentPropsWithoutRef <typeof TabsPrimitive.Trigger>>(({ className, ...props }, ref) => ( <TabsPrimitive.Trigger ref ={ref} className ={c n( 'inline - flex items - center justify - center whitespace - nowrap rounded - sm px - 3 py - 1.5 text - sm font - medium ring - offset - background transition - all focus - v, i, s, i, b, l, e:outline - none focus - v, i, s, i, b, l, e:ring - 2 focus - v, i, s, i, b, l, e:ring - ring focus - v, i, s, i, b, l, e:ring - offset - 2 d, i, s, a, b, l, e, d:pointer - events - none d, i, s, a, b, l, e, d:opacity - 50 data -[state = active]:bg - background data -[state = active]:text - foreground data -[state = active]:shadow-sm', className)
  }, {...props}/>
))
TabsTrigger.display Name = TabsPrimitive.Trigger.displayName const Tabs Content = React.forwardRef <React.ElementRef <typeof TabsPrimitive.Content>, React.ComponentPropsWithoutRef <typeof TabsPrimitive.Content>>(({ className, ...props }, ref) => ( <TabsPrimitive.Content ref ={ref} className ={c n( 'mt - 2 ring - offset - background focus - v, i, s, i, b, l, e:outline - none focus - v, i, s, i, b, l, e:ring - 2 focus - v, i, s, i, b, l, e:ring - ring focus - v, i, s, i, b, l, e:ring - offset-2', className)
  }, {...props}/>
))
TabsContent.display Name = TabsPrimitive.Content.displayName export { Tabs, TabsList, TabsTrigger, TabsContent }
