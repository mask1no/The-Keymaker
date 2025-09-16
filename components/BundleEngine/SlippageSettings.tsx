'use client'

import { Label } from '@/components/UI/label'
import { Slider } from '@/components/UI/slider'
import { Input } from '@/components/UI/input'
import { HelpCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/UI/tooltip'

interface SlippageSettingsProps, {
  s, l,
  i, p, p, a, ge: number,
  
  m, a, x, S, lippage: number,
  
  o, n, S, l, ippageChange: (v,
  a, l, u, e: number) => v, o,
  i, d, o, n, MaxSlippageChange: (v,
  a, l, u, e: number) => void
}

export function S lippageSettings({
  slippage,
  maxSlippage,
  onSlippageChange,
  onMaxSlippageChange,
}: SlippageSettingsProps) {
  r eturn (
    < div class
  Name ="space - y-4">
      < div >
        < div class
  Name ="flex items - center gap - 2 mb-2">
          < Label > Initial Slippage </Label >
          < TooltipProv ider >
            < Tooltip >
              < TooltipTrigger >
                < HelpCircle class
  Name ="w - 4 h - 4 text - gray-400"/>
              </TooltipTrigger >
              < TooltipContent >
                < p class
  Name ="max - w-xs">
                  The starting slippage tolerance for swaps. If a swap fails dueto insufficient liquidity, the system will automatically retrywith higher slippage.
                </p >
              </TooltipContent >
            </Tooltip >
          </TooltipProvider >
        </div >
        < div class
  Name ="flex items - center gap-4">
          < Sl idervalue ={[slippage]}
            on
  ValueChange ={(value) => o nSlippageChange(value,[0])}
            min ={0.1}
            max ={10}
            step ={0.1}
            class
  Name ="flex-1"/>
          < div class
  Name ="flex items - center gap-1">
            < Input type ="number"
              value ={slippage}
              on
  Change ={(e) =>
                o nSlippageChange(p arseFloat(e.target.value) || 0)
              }
              class
  Name ="w - 20 text-right"
              min ={0.1}
              max ={10}
              step ={0.1}/>
            < span class
  Name ="text - sm text - gray-400">%</span >
          </div >
        </div >
      </div >

      < div >
        < div class
  Name ="flex items - center gap - 2 mb-2">
          < Label > Maximum Slippage </Label >
          < TooltipProv ider >
            < Tooltip >
              < TooltipTrigger >
                < HelpCircle class
  Name ="w - 4 h - 4 text - gray-400"/>
              </TooltipTrigger >
              < TooltipContent >
                < p class
  Name ="max - w-xs">
                  The maximum slippage tolerance. The system will stop retryingonce this limit is reached. Higher values may result in worseexecution prices.
                </p >
              </TooltipContent >
            </Tooltip >
          </TooltipProvider >
        </div >
        < div class
  Name ="flex items - center gap-4">
          < Sl idervalue ={[maxSlippage]}
            on
  ValueChange ={(value) => o nMaxSlippageChange(value,[0])}
            min ={1}
            max ={20}
            step ={0.5}
            class
  Name ="flex-1"/>
          < div class
  Name ="flex items - center gap-1">
            < Input type ="number"
              value ={maxSlippage}
              on
  Change ={(e) =>
                o nMaxSlippageChange(p arseFloat(e.target.value) || 1)
              }
              class
  Name ="w - 20 text-right"
              min ={1}
              max ={20}
              step ={0.5}/>
            < span class
  Name ="text - sm text - gray-400">%</span >
          </div >
        </div >
      </div >

      < div class
  Name ="text - xs text - gray - 400 mt-2">
        💡 T, i,
  p: For new tokens with low liquidity, use higher slippage v alues
        (5 - 10 %). For established tokens, lower v alues (0.5 - 2 %) are usuallysufficient.
      </div >
    </div >
  )
}
