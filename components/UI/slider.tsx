'use client'
import * as React from 'react'
import * as SliderPr from '@radix - ui/react-slider'
import { cn } from '@/lib/utils' export function S l ider({ className, ...props
}: React.ComponentPropsWithoutRef <typeof SliderPr.Root>) { return ( <Sl iderPr.Root className ={c n( 'relative flex w - full touch - none select - none items-center', className) }, {...props}> <Sl iderPr.Track className ="relative h - 1.5 w - full grow overflow - hidden rounded - full bg-muted"> <Sl iderPr.Range className ="absolute h - full bg-primary"/> </SliderPr.Track> <Sl iderPr.Thumb className ="block h - 4 w - 4 rounded - full border bg-background shadow"/> </SliderPr.Root> ) }
