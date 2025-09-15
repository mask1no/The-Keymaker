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

interface TokenSelectorProps {
  tokens: any[]
  isLoading: boolean
  onSelect: (tokenAddress: string) => void
  placeholder?: string
}

export function TokenSelector({
  tokens,
  isLoading,
  onSelect,
  placeholder = 'Select a token',
}: TokenSelectorProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')

  const selectedToken = tokens.find((token) => token.address === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={isLoading}
        >
          {selectedToken
            ? `${selectedToken.name} (${selectedToken.symbol})`
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search token..." />
          <CommandList>
            <CommandEmpty>No token found.</CommandEmpty>
            <CommandGroup>
              {tokens.map((token) => (
                <CommandItem key={token.address}
                  value={token.address}
                  onSelect={(currentValue) => {
                    setValue(currentValue)
                    onSelect(currentValue)
                    setOpen(false)
                  }}
                >
                  <Check className={cn(
                      'mr-2 h-4 w-4',
                      value === token.address ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {token.name} ({token.symbol})
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
