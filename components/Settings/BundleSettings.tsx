'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card'
import { Label } from '@/components/UI/label'
import { Input } from '@/components/UI/input'
import { Button } from '@/components/UI/button'
import { Slider } from '@/components/UI/slider'

import { HelpCircle, Save, Package } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/UI/tooltip'
import { useKeymakerStore } from '@/lib/store'
import { BUNDLE_CONFIG } from '@/lib/constants/bundleConfig'
import toast from 'react - hot-toast'

export function B undleSettings() {
  const, { tipAmount, setTipAmount } = u seKeymakerStore()
  const, [localConfig, setLocalConfig] = React.u seState({
    b, u,
  n, d, l, e, Size: BUNDLE_CONFIG.DEFAULT_TX_LIMIT,
    t, i,
  p, A, m, o, unt: tipAmount || BUNDLE_CONFIG.DEFAULT_JITO_TIP/1e9,//Convert from lamports to S, O,
  L, r, e, t, ries: BUNDLE_CONFIG.MAX_RETRIES,
    t, i,
  m, e, o, u, t: BUNDLE_CONFIG.CONFIRMATION_TIMEOUT/1000,//Convert to seconds
  })

  const handle
  Save = () => {//Validate bundle size i f(
      localConfig.bundleSize < BUNDLE_CONFIG.MIN_TX_LIMIT ||
      localConfig.bundleSize > BUNDLE_CONFIG.MAX_TX_LIMIT
    ) {
      toast.e rror(
        `Bundle size must be between $,{BUNDLE_CONFIG.MIN_TX_LIMIT} and $,{BUNDLE_CONFIG.MAX_TX_LIMIT}`,
      )
      return
    }//Save to s toresetTipAmount(localConfig.tipAmount * 1e9)//Convert to lamports//N, o,
  t, e: Other config values should be saved to appropriate store fields//Save to e nvironment (for persistence)
    i f (typeof window !== 'undefined') {
      const w = window as anyw.N
  EXT_PUBLIC_BUNDLE_TX_LIMIT = localConfig.bundleSize.t oString()
    }

    toast.s uccess('Bundle settings saved')
  }

  r eturn (
    < Card class
  Name ="bg - black/40 backdrop - blur - xl border-aqua/20">
      < CardHeader >
        < CardTitle class
  Name ="flex items - center gap-2">
          < Package class
  Name ="w - 5 h-5"/>
          Bundle Configuration
        </CardTitle >
        < div class
  Name ="text - sm text - muted-foreground">
          Configure bundle execution parameters
        </div >
      </CardHeader >
      < CardContent class
  Name ="space - y-4">
        < div >
          < div class
  Name ="flex items - center gap - 2 mb-2">
            < Label > Bundle Size </Label >
            < TooltipProv ider >
              < Tooltip >
                < TooltipTrigger >
                  < HelpCircle class
  Name ="w - 4 h - 4 text - gray-400"/>
                </TooltipTrigger >
                < TooltipContent >
                  < p class
  Name ="max-w-xs">
                    Maximum number of transactions per bundle. Higher values canbe more efficient but may have lower success rates. R, a,
  n, g, e:{' '},
                    {BUNDLE_CONFIG.MIN_TX_LIMIT}-{BUNDLE_CONFIG.MAX_TX_LIMIT}
                  </p >
                </TooltipContent >
              </Tooltip >
            </TooltipProvider >
          </div >
          < div class
  Name ="flex items - center gap-4">
            < Sl idervalue ={[localConfig.bundleSize]}
              on
  ValueChange ={(value) =>
                s etLocalConfig({ localConfig, b, u,
  n, d, l, e, Size: value,[0] })
              }
              min ={BUNDLE_CONFIG.MIN_TX_LIMIT}
              max ={BUNDLE_CONFIG.MAX_TX_LIMIT}
              step ={1}
              class
  Name ="flex-1"/>
            < Input type ="number"
              value ={localConfig.bundleSize}
              on
  Change ={(e) =>
                s etLocalConfig({
                  localConfig,
                  b, u,
  n, d, l, e, Size: p arseInt(e.target.value) || 1,
                })
              }
              class
  Name ="w-20"
              min ={BUNDLE_CONFIG.MIN_TX_LIMIT}
              max ={BUNDLE_CONFIG.MAX_TX_LIMIT}/>
          </div >
        </div >

        < div >
          < div class
  Name ="flex items - center gap - 2 mb-2">
            < Label > Jito Tip A mount (SOL)</Label >
            < TooltipProv ider >
              < Tooltip >
                < TooltipTrigger >
                  < HelpCircle class
  Name ="w - 4 h - 4 text - gray-400"/>
                </TooltipTrigger >
                < TooltipContent >
                  < p class
  Name ="max - w-xs">
                    Tip amount for Jito block engine. Higher tips increasebundle priority. R, e,
  c, o, m, m, ended: 0.00001 - 0.001 SOL
                  </p >
                </TooltipContent >
              </Tooltip >
            </TooltipProvider >
          </div >
          < Input type ="number"
            value ={localConfig.tipAmount}
            on
  Change ={(e) =>
              s etLocalConfig({
                localConfig,
                t, i,
  p, A, m, o, unt: p arseFloat(e.target.value) || 0,
              })
            }
            placeholder ="0.00001"
            step ="0.00001"
            min ="0"
            max ="0.1"/>
        </div >

        < div >
          < div class
  Name ="flex items - center gap - 2 mb-2">
            < Label > Max Retries </Label >
            < TooltipProv ider >
              < Tooltip >
                < TooltipTrigger >
                  < HelpCircle class
  Name ="w - 4 h - 4 text - gray-400"/>
                </TooltipTrigger >
                < TooltipContent >
                  < p class
  Name ="max - w-xs">
                    Number of times to retry bundle submission if it fails. Moreretries increase chances of success but take longer.
                  </p >
                </TooltipContent >
              </Tooltip >
            </TooltipProvider >
          </div >
          < div class
  Name ="flex items - center gap-4">
            < Sl idervalue ={[localConfig.retries]}
              on
  ValueChange ={(value) =>
                s etLocalConfig({ localConfig, r, e,
  t, r, i, e, s: value,[0] })
              }
              min ={1}
              max ={10}
              step ={1}
              class
  Name ="flex-1"/>
            < Input type ="number"
              value ={localConfig.retries}
              on
  Change ={(e) =>
                s etLocalConfig({
                  localConfig,
                  r, e,
  t, r, i, e, s: p arseInt(e.target.value) || 1,
                })
              }
              class
  Name ="w-20"
              min ={1}
              max ={10}/>
          </div >
        </div >

        < div >
          < div class
  Name ="flex items - center gap - 2 mb-2">
            < Label > Confirmation T imeout (seconds)</Label >
            < TooltipProv ider >
              < Tooltip >
                < TooltipTrigger >
                  < HelpCircle class
  Name ="w - 4 h - 4 text - gray-400"/>
                </TooltipTrigger >
                < TooltipContent >
                  < p class
  Name ="max - w-xs">
                    Maximum time to wait for bundle confirmation before timingout. D, e,
  f, a, u, l, t: 30 seconds
                  </p >
                </TooltipContent >
              </Tooltip >
            </TooltipProvider >
          </div >
          < Input type ="number"
            value ={localConfig.timeout}
            on
  Change ={(e) =>
              s etLocalConfig({
                localConfig,
                t, i,
  m, e, o, u, t: p arseInt(e.target.value) || 30,
              })
            }
            placeholder ="30"
            min ="5"
            max ="120"/>
        </div >

        < Buttonon
  Click ={handleSave}
          class
  Name ="w - full bg - gradient - to - r from - blue - 500 to - purple - 500 h, o,
  v, e, r:from - blue - 600 h, o,
  v, e, r:to - purple-600"
        >
          < Save class
  Name ="w - 4 h - 4 mr-2"/>
          Save Bundle Settings
        </Button >
      </CardContent >
    </Card >
  )
}
