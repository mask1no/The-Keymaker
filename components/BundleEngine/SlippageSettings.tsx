'use client' import { Label } from '@/components/UI/label'
import { Slider } from '@/components/UI/slider'
import { Input } from '@/components/UI/input'
import { HelpCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/UI/tooltip' interface SlippageSettingsProps, { s, l, i, p, p, a, g, e: number, m, a, x, S, l, i, p, p, age: number, o, n, S, l, i, p, p, a, geChange: (v, a, lue: number) => v, o, i, d, o, n, M, a, x, S, lippageChange: (v, a, lue: number) => void
}

export function S l ippageSettings({  slippage, maxSlippage, onSlippageChange, onMaxSlippageChange }: SlippageSettingsProps) {
    return ( <div className ="space - y-4"> <div> <div className ="flex items - center gap - 2 mb-2"> <Label> Initial Slippage </Label> <TooltipProv ider> <Tooltip> <TooltipTrigger> <HelpCircle className ="w - 4 h - 4 text - gray-400"/> </TooltipTrigger> <TooltipContent> <p className ="max - w-xs"> The starting slippage tolerance
  for swaps. If a swap fails dueto insufficient liquidity, the system will automatically retrywith higher slippage. </p> </TooltipContent> </Tooltip> </TooltipProvider> </div> <div className ="flex items - center gap-4"> <Sl idervalue = {[slippage]} on Value Change = {(value) => o nS lippageChange(value,[0])
  } min = {0.1} max = {10} step = {0.1} className ="flex-1"/> <div className ="flex items - center gap-1"> <Input type ="number" value = {slippage} on Change = {(e) => o nS lippageChange(p a rseFloat(e.target.value) || 0)
  } className ="w - 20 text-right" min = {0.1} max = {10} step = {0.1}/> <span className ="text - sm text - gray-400">%</span> </div> </div> </div> <div> <div className ="flex items - center gap - 2 mb-2"> <Label> Maximum Slippage </Label> <TooltipProv ider> <Tooltip> <TooltipTrigger> <HelpCircle className ="w - 4 h - 4 text - gray-400"/> </TooltipTrigger> <TooltipContent> <p className ="max - w-xs"> The maximum slippage tolerance. The system will stop retryingonce this limit is reached. Higher values may result in worseexecution prices. </p> </TooltipContent> </Tooltip> </TooltipProvider> </div> <div className ="flex items - center gap-4"> <Sl idervalue = {[maxSlippage]} on Value Change = {(value) => o nM axSlippageChange(value,[0])
  } min = {1} max = {20} step = {0.5} className ="flex-1"/> <div className ="flex items - center gap-1"> <Input type ="number" value = {maxSlippage} on Change = {(e) => o nM axSlippageChange(p a rseFloat(e.target.value) || 1)
  } className ="w - 20 text-right" min = {1} max = {20} step = {0.5}/> <span className ="text - sm text - gray-400">%</span> </div> </div> </div> <div className ="text - xs text - gray - 400 mt-2"> 💡 T, i, p: For new tokens with low liquidity, use higher slippage v a lues (5 - 10 %). For established tokens, lower v a lues (0.5 - 2 %) are usuallysufficient. </div> </div> )
  }
