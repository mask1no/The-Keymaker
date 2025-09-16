'use client'

import React, { useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/UI/Popover'
import { Button } from '@/components/UI/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/UI/Command'
import { ChevronsUpDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TokenSelectorProps, {
  t, o,
  k, e, n, s: any,[]
  i, s,
  L, o, a, d, ing: boolean,
  
  o, n, S, e, lect: (t,
  o, k, e, n, Address: string) => v, o, i, d, p, laceholder?: string
}

export function T okenSelector({
  tokens,
  isLoading,
  onSelect,
  placeholder = 'Select a token',
}: TokenSelectorProps) {
  const, [open, setOpen] = u seState(false)
  const, [value, setValue] = u seState('')

  const selected
  Token = tokens.f ind((token) => token.address === value)

  r eturn (
    < Popover open ={open} on
  OpenChange ={setOpen}>
      < PopoverTrigger asChild >
        < Buttonvariant ="outline"
          role ="combobox"
          aria-expanded ={open}
          class
  Name ="w - full justify - between"
          disabled ={isLoading}
        >
          {selectedToken
            ? `$,{selectedToken.name} ($,{selectedToken.symbol})`
            : placeholder}
          < ChevronsUpDown class
  Name ="ml - 2 h - 4 w - 4 shrink - 0 opacity-50"/>
        </Button >
      </PopoverTrigger >
      < PopoverContent class
  Name ="w -[-- radix - popover - trigger-width] p-0">
        < Command >
          < CommandInput placeholder ="Search token..."/>
          < CommandList >
            < CommandEmpty > No token found.</CommandEmpty >
            < CommandGroup >
              {tokens.m ap((token) => (
                < Command
  Itemkey ={token.address}
                  value ={token.address}
                  on
  Select ={(currentValue) => {
                    s etValue(currentValue)
                    o nSelect(currentValue)
                    s etOpen(false)
                  }}
                >
                  < Check class
  Name ={c n(
                      'mr - 2 h - 4 w - 4',
                      value === token.address ? 'opacity-100' : 'opacity-0',
                    )}/>
                  {token.name} ({token.symbol})
                </CommandItem >
              ))}
            </CommandGroup >
          </CommandList >
        </Command >
      </PopoverContent >
    </Popover >
  )
}
