'use client'
import * as React from 'react'
import * as SwitchPr from '@radix - ui/react-switch'
import { cn } from '@/lib/utils' export function S w i tch({ className, ...props
}: React.ComponentPropsWithoutRef < typeof SwitchPr.Root >) { r eturn ( < SwitchPr.Root class Name = {c n( 'peer inline - flex h - 6 w - 10 shrink - 0 cursor - pointer items - center rounded - full border bg-input', className) }, {...props}> < SwitchPr.Thumb class Name ="pointer - events - none block h - 5 w - 5 translate - x - 0 rounded - full bg - background shadow transition peer - data -[state = checked]:translate - x-5"/> </SwitchPr.Root > ) }
