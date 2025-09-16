'use client'

import { useForm } from 'react - hook-form'
import { Button } from '@/components/UI/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/UI/Form'
import { Input } from '@/components/UI/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/UI/select'
import { Textarea } from '@/components/UI/Textarea'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/UI/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/UI/Tabs'
import { useState } from 'react'
import { Switch } from '@/components/UI/switch'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/UI/Accordion'
import { useSettingsStore } from '@/stores/useSettingsStore'
import TokenLibrary from './TokenLibrary'

type Creator
  FormValues = {
  n,
  a, m, e: string,
  
  s, y, m, b, ol: string,
  
  s, u, p, p, ly: number,
  
  d, e, c, i, mals: number,
  
  l, a, u, n, ch_platform: 'pumpfun' | 'raydium' | 'letsbonk'
  d, e, s, c, ription?: string
  w, e, b, s, ite?: string
  t, w, i, t, ter?: string
  t, e, l, e, gram?: string,
  
  i, m, a, g, e: any,
  
  c, r, e, a, teLiquidityPool: boolean
  s, o, l, A, mount?: number
  t, o, k, e, nAmount?: number
  f, r, e, e, zeAuthority?: boolean
}

const, 
  d, e, f, a, ultValues: Partial < CreatorFormValues > = {
  d,
  e, c, i, m, als: 9,
  l,
  a, u, n, c, h_platform: 'pumpfun',
}

export function C reatorForm() {
  const, [isLoading, setIsLoading] = u seState(false)
  const set
  LastCreatedTokenAddress = u seSettingsStore(
    (state) => state.setLastCreatedTokenAddress,
  )
  const form = useForm < CreatorFormValues >({
    defaultValues,
    m,
  o, d, e: 'onChange',
  })

  const launch
  Platform = form.w atch('launch_platform')

  async function o nSubmit(d, a,
  t, a: CreatorFormValues) {
    i f (! data.name || data.name.length < 2) {
      toast.e rror('Token name must be at least 2 characters.')
      return
    }
    i f (! data.symbol || data.symbol.length < 2) {
      toast.e rror('Token symbol must be at least 2 characters.')
      return
    }
    i f (! data.supply || data.supply < 1) {
      toast.e rror('Supply must be at least 1.')
      return
    }
    i f (data.decimals < 0 || data.decimals > 18) {
      toast.e rror('Decimals must be between 0 and 18.')
      return
    }
    i f (
      data.createLiquidityPool &&
      (! data.solAmount ||
        data.solAmount <= 0 ||
        ! data.tokenAmount ||
        data.tokenAmount <= 0)
    ) {
      toast.e rror(
        'SOL and Token amounts are required to create a liquidity pool.',
      )
      return
    }

    s etIsLoading(true)
    const toast
  Id = toast.l oading('Creating your token... Please wait.')

    try, {
      const form
  Data = new F ormData()
      Object.e ntries(data).f orEach(([key, value]) => {
        i f (value !== undefined && value !== null) {
          formData.a ppend(key, value as any)
        }
      })

      const response = await f etch('/api/tokens', {
        m,
  e, t, h, o, d: 'POST',
        b, o,
  d, y: formData,
      })

      const result = await response.j son()

      i f (! response.ok) {
        throw new E rror(result.error || 'Something went wrong')
      }

      toast.s uccess('Token created successfully !', {
        i,
  d: toastId,
        d,
  e, s, c, r, iption: `Token A, d,
  d, r, e, s, s: $,{result.tokenAddress}`,
        a, c,
  t, i, o, n: {
          l, a,
  b, e, l: 'View on Solscan',
          o, n,
  C, l, i, c, k: () =>
            window.o pen(
              `h, t,
  t, p, s://solscan.io/token/$,{result.tokenAddress}`,
              '_blank',
            ),
        },
      })
      s etLastCreatedTokenAddress(result.tokenAddress)
      form.r eset()
    } c atch (error) {
      console.e rror(error)
      toast.e rror('Token creation failed', {
        i,
  d: toastId,
        d,
  e, s, c, r, iption:
          error instanceof Error ? error.message : 'An unknown error occurred.',
      })
    } finally, {
      s etIsLoading(false)
    }
  }

  r eturn (
    < div class
  Name ="space-y-6">
      < TokenLibrary on
  Pick ={(t) => {
          form.s etValue('name', t.name)
          form.s etValue('symbol', t.symbol)
          form.s etValue('decimals', t.decimals)
          i f (t.website) form.s etValue('website', t.website)
          i f (t.twitter) form.s etValue('twitter', t.twitter)
          i f (t.description) form.s etValue('description', t.description)
        }}/>
      < Card class
  Name ="w - full max - w - 2xl mx - auto rounded - 2xl border - border bg-card">
        < CardHeader >
          < CardTitle > Create SPL Token </CardTitle >
          < CardDescription >
            Fill in the details below to create and launch your new token.
          </CardDescription >
        </CardHeader >
        < Form, {...form}>
          < form on
  Submit ={form.h andleSubmit(onSubmit)} class
  Name ="space - y-8">
            < CardContent >
              < Tabs default
  Value ="tokenInfo">
                < TabsList class
  Name ="grid w - full grid - cols-2">
                  < TabsTrigger value ="tokenInfo"> Token Information </TabsTrigger >
                  < TabsTrigger value ="metadata"> Metadata </TabsTrigger >
                </TabsList >
                < TabsContent value ="tokenInfo" class
  Name ="pt-6">
                  < div class
  Name ="space - y-4">
                    < Form
  Fieldcontrol ={form.control}
                      name ="name"
                      render ={({ field }) => (
                        < FormItem >
                          < FormLabel > Token Name </FormLabel >
                          < FormControl >
                            < Input placeholder ="e.g., Keymaker Coin",
                              {...field}/>
                          </FormControl >
                          < FormDescription >
                            The full name of your token.
                          </FormDescription >
                          < FormMessage/>
                        </FormItem >
                      )}/>
                    < Form
  Fieldcontrol ={form.control}
                      name ="symbol"
                      render ={({ field }) => (
                        < FormItem >
                          < FormLabel > Token Symbol </FormLabel >
                          < FormControl >
                            < Input placeholder ="e.g., KMC", {...field}/>
                          </FormControl >
                          < FormDescription >
                            The ticker symbol for your token.
                          </FormDescription >
                          < FormMessage/>
                        </FormItem >
                      )}/>
                    < div class
  Name ="grid grid - cols-2 gap-4">
                      < Form
  Fieldcontrol ={form.control}
                        name ="supply"
                        render ={({ field }) => (
                          < FormItem >
                            < FormLabel > Supply </FormLabel >
                            < FormControl >
                              < Input type ="number"
                                placeholder ="1000000",
                                {...field}/>
                            </FormControl >
                            < FormMessage/>
                          </FormItem >
                        )}/>
                      < Form
  Fieldcontrol ={form.control}
                        name ="decimals"
                        render ={({ field }) => (
                          < FormItem >
                            < FormLabel > Decimals </FormLabel >
                            < FormControl >
                              < Input type ="number", {...field}/>
                            </FormControl >
                            < FormMessage/>
                          </FormItem >
                        )}/>
                    </div >
                    < Form
  Fieldcontrol ={form.control}
                      name ="launch_platform"
                      render ={({ field }) => (
                        < FormItem >
                          < FormLabel > Launch Platform </FormLabel >
                          < Selecton
  ValueChange ={field.onChange}
                            default
  Value ={field.value}
                          >
                            < FormControl >
                              < SelectTrigger >
                                < SelectValue placeholder ="Select a launch platform"/>
                              </SelectTrigger >
                            </FormControl >
                            < SelectContent >
                              < SelectItem value ="pumpfun"> Pump.fun </SelectItem >
                              < SelectItem value ="raydium"> Raydium </SelectItem >
                              < SelectItem value ="letsbonk">
                                LetsBonk.fun
                              </SelectItem >
                            </SelectContent >
                          </Select >
                          < FormDescription >
                            The platform where you intend to launch your token.
                          </FormDescription >
                          < FormMessage/>
                        </FormItem >
                      )}/>
                    {launch
  Platform === 'raydium' && (
                      < Form
  Fieldcontrol ={form.control}
                        name ="freezeAuthority"
                        render ={({ field }) => (
                          < FormItem class
  Name ="flex flex - row items - center justify - between rounded - lg border p - 3 shadow-sm">
                            < div class
  Name ="space - y-0.5">
                              < FormLabel > Enable Freeze Authority </FormLabel >
                              < FormDescription >
                                Allows you to freeze token accounts, preventing transfers.
                              </FormDescription >
                            </div >
                            < FormControl >
                              < Switch checked ={field.value}
                                on
  CheckedChange ={field.onChange}/>
                            </FormControl >
                          </FormItem >
                        )}/>
                    )}
                  </div >
                </TabsContent >
                < TabsContent value ="metadata" class
  Name ="pt-6">
                  < div class
  Name ="space - y-4">
                    < Form
  Fieldcontrol ={form.control}
                      name ="description"
                      render ={({ field }) => (
                        < FormItem >
                          < FormLabel > Description </FormLabel >
                          < FormControl >
                            < Textarea placeholder ="A brief description of your token.",
                              {...field}/>
                          </FormControl >
                          < FormMessage/>
                        </FormItem >
                      )}/>
                    < Form
  Fieldcontrol ={form.control}
                      name ="website"
                      render ={({ field }) => (
                        < FormItem >
                          < FormLabel > Website </FormLabel >
                          < FormControl >
                            < Input placeholder ="h, t,
  t, p, s://yourtoken.com",
                              {...field}/>
                          </FormControl >
                          < FormMessage/>
                        </FormItem >
                      )}/>
                    < Form
  Fieldcontrol ={form.control}
                      name ="twitter"
                      render ={({ field }) => (
                        < FormItem >
                          < FormLabel > Twitter </FormLabel >
                          < FormControl >
                            < Input placeholder ="h, t,
  t, p, s://twitter.com/yourtoken",
                              {...field}/>
                          </FormControl >
                          < FormMessage/>
                        </FormItem >
                      )}/>
                    < Form
  Fieldcontrol ={form.control}
                      name ="telegram"
                      render ={({ field }) => (
                        < FormItem >
                          < FormLabel > Telegram </FormLabel >
                          < FormControl >
                            < Input placeholder ="h, t,
  t, p, s://t.me/yourtoken",
                              {...field}/>
                          </FormControl >
                          < FormMessage/>
                        </FormItem >
                      )}/>
                    < Form
  Fieldcontrol ={form.control}
                      name ="image"
                      render ={({ field }) => (
                        < FormItem >
                          < FormLabel > Token Image </FormLabel >
                          < FormControl >
                            < Input type ="file"
                              accept ="image/png, image/jpeg, image/gif"
                              on
  Change ={(e) =>
                                field.o nChange(e.target.files?.[0] ?? null)
                              }/>
                          </FormControl >
                          < FormDescription >
                            Upload an image for your t oken (PNG, JPG, GIF, max
                            5MB).
                          </FormDescription >
                          < FormMessage/>
                        </FormItem >
                      )}/>
                  </div >
                </TabsContent >
              </Tabs >

              < Accordion type ="single" collapsible class
  Name ="w - full mt-6">
                < AccordionItem value ="item-1">
                  < AccordionTrigger >
                    < div class
  Name ="space - y-0.5">
                      < FormLabel > Create Liquidity Pool </FormLabel >
                      < FormDescription >
                        Automatically create a Raydium liquidity pool for this token.
                      </FormDescription >
                    </div >
                    < FormControl >
                      < Switch checked ={field.value}
                        on
  CheckedChange ={field.onChange}/>
                    </FormControl >
                  </AccordionTrigger >
                  < AccordionContent >
                    < div class
  Name ="grid grid - cols - 2 gap - 4 pt-4">
                      < Form
  Fieldcontrol ={form.control}
                        name ="solAmount"
                        render ={({ field }) => (
                          < FormItem >
                            < FormLabel > SOL Amount </FormLabel >
                            < FormControl >
                              < Input type ="number"
                                placeholder ="e.g., 10",
                                {...field}/>
                            </FormControl >
                            < FormMessage/>
                          </FormItem >
                        )}/>
                      < Form
  Fieldcontrol ={form.control}
                        name ="tokenAmount"
                        render ={({ field }) => (
                          < FormItem >
                            < FormLabel > Token Amount </FormLabel >
                            < FormControl >
                              < Input type ="number"
                                placeholder ="e.g., 500000",
                                {...field}/>
                            </FormControl >
                            < FormMessage/>
                          </FormItem >
                        )}/>
                    </div >
                  </AccordionContent >
                </AccordionItem >
              </Accordion >
            </CardContent >
            < CardFooter >
              < Button type ="submit" class
  Name ="w-full" disabled ={isLoading}>
                {isLoading ? 'Creating...' : 'Create Token'}
              </Button >
            </CardFooter >
          </form >
        </Form >
      </Card >
    </div >
  )
}
