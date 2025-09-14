'use client'

import React from 'react'
import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/UI/Sheet'
import { Button } from '@/components/UI/button'
import { Input } from '@/components/UI/input'
import { Label } from '@/components/UI/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/UI/select'
import { Settings } from 'lucide-react'

export function BundleSettings() {
  const [jitoRegion, setJitoRegion] = useState('ffm')
  const [jitoTip, setJitoTip] = useState(0.0001)

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full">
          <Settings className="mr-2 h-4 w-4" />
          Bundle Settings
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Bundle Settings</SheetTitle>
          <SheetDescription>
            Configure global settings for your bundle execution.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="jito-region" className="text-right">
              Jito Region
            </Label>
            <Select
              defaultValue={jitoRegion}
              onValueChange={setJitoRegion}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ffm">Frankfurt</SelectItem>
                <SelectItem value="ny">New York</SelectItem>
                <SelectItem value="ams">Amsterdam</SelectItem>
                <SelectItem value="tokyo">Tokyo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="jito-tip" className="text-right">
              Jito Tip (SOL)
            </Label>
            <Input
              id="jito-tip"
              type="number"
              value={jitoTip}
              onChange={(e) => setJitoTip(parseFloat(e.target.value))}
              className="col-span-3"
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
