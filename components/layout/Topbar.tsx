'use client'

import { StatusBento } from '@/components/ui/StatusBento'
import { Badge } from '@/components/UI/badge'

interface TopbarProps {
  group?: string
  region?: string
  mode?: string
  className?: string
}

export function Topbar({
  group = 'Neo',
  region = 'ffm',
  mode = 'Regular',
  className = ''
}: TopbarProps) {
  return (
    <header className={`flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-sm px-6 py-4 ${className}`}>
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-foreground">
          The Keymaker
        </h1>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Group: {group}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Region: {region}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Mode: {mode}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <StatusBento />
      </div>
    </header>
  )
}
