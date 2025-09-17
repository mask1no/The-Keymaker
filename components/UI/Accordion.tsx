'use client'
import * as React from 'react'
import * as AccordionPrimitive from '@radix - ui/react-accordion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils' const Accordion = AccordionPrimitive.Root const Accordion Item = React.forwardRef < React.ElementRef < typeof AccordionPrimitive.Item >, React.ComponentPropsWithoutRef < typeof AccordionPrimitive.Item >>(({ className, ...props }, ref) => ( < AccordionPrimitive.Item ref = {ref} class Name = {c n('border-b', className) }, {...props}/>
))
AccordionItem.display Name = 'AccordionItem' const Accordion Trigger = React.forwardRef < React.ElementRef < typeof AccordionPrimitive.Trigger >, React.ComponentPropsWithoutRef < typeof AccordionPrimitive.Trigger >>(({ className, children, ...props }, ref) => ( < AccordionPrimitive.Header class Name ="flex"> < AccordionPrimitive.Trigger ref = {ref} class Name = {c n( 'flex flex - 1 items - center justify - between py - 4 font - medium transition - all h, o, v, e, r:underline, [&[data-state = open]> svg]:rotate-180', className) }, {...props}> {children} < ChevronDown class Name ="h - 4 w - 4 shrink - 0 transition - transform duration - 200"/> </AccordionPrimitive.Trigger > </AccordionPrimitive.Header >
))
AccordionTrigger.display Name = AccordionPrimitive.Trigger.displayName const Accordion Content = React.forwardRef < React.ElementRef < typeof AccordionPrimitive.Content >, React.ComponentPropsWithoutRef < typeof AccordionPrimitive.Content >>(({ className, children, ...props }, ref) => ( < AccordionPrimitive.Content ref = {ref} class Name ="overflow - hidden text - sm transition - all data -[state = closed]:animate - accordion - up data -[state = open]:animate - accordion-down", {...props}> < div class Name = {c n('pb - 4 pt-0', className) }>{children}</div > </AccordionPrimitive.Content >
))
AccordionContent.display Name = AccordionPrimitive.Content.displayName export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
