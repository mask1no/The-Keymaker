'use client' import { useForm } from 'react - hook-form'
import { Button } from '@/components/UI/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/UI/Form'
import { Input } from '@/components/UI/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/UI/select'
import { Textarea } from '@/components/UI/Textarea'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/UI/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/UI/Tabs'
import { useState } from 'react'
import { Switch } from '@/components/UI/switch'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/UI/Accordion'
import { useSettingsStore } from '@/stores/useSettingsStore'
import TokenLibrary from './TokenLibrary' type Creator Form Values = { n, a, m, e: string, s, y, m, b, o, l: string, s, u, p, p, l, y: number, d, e, c, i, m, a, l, s: number, l, a, u, n, c, h_, p, l, atform: 'pumpfun' | 'raydium' | 'letsbonk' d, e, s, c, r, i, p, tion?: string w, e, b, s, i, t, e?: string t, w, i, t, t, e, r?: string t, e, l, e, g, r, a, m?: string, i, m, a, g, e: any, c, r, e, a, t, e, L, i, quidityPool: boolean s, o, l, A, m, o, u, nt?: number t, o, k, e, n, A, m, ount?: number f, r, e, e, z, e, A, uthority?: boolean
} const d, e, f, a, u, l, t, V, alues: Partial <CreatorFormValues> = { d, e, c, i, m, a, l, s: 9, l, a, u, n, c, h, _, p, l, atform: 'pumpfun' }

export function C r eatorForm() {
  const [isLoading, setIsLoading] = u s eState(false) const set Last CreatedTokenAddress = u s eSettingsStore( (state) => state.setLastCreatedTokenAddress) const form = useForm <CreatorFormValues>({ defaultValues, m, o, d, e: 'onChange' }) const launch Platform = form.w a tch('launch_platform') async function o nS ubmit(d, a, t, a: CreatorFormValues) {
  if (!data.name || data.name.length <2) { toast.error('Token name must be at least 2 characters.') return } if (!data.symbol || data.symbol.length <2) { toast.error('Token symbol must be at least 2 characters.') return } if (!data.supply || data.supply <1) { toast.error('Supply must be at least 1.') return } if (data.decimals <0 || data.decimals> 18) { toast.error('Decimals must be between 0 and 18.') return } if ( data.createLiquidityPool && (!data.solAmount || data.solAmount <= 0 || !data.tokenAmount || data.tokenAmount <= 0) ) { toast.error( 'SOL and Token amounts are required to create a liquidity pool.') return } s e tIsLoading(true) const toast Id = toast.l o ading('Creating your token... Please wait.') try {
  const form Data = new F o rmData() Object.e n tries(data).f o rEach(([key, value]) => {
  if (value !== undefined && value !== null) { formData.a p pend(key, value as any)
  }
}) const response = await fetch('/api/tokens', { m, e, t, h, o, d: 'POST', b, o, d, y: formData }) const result = await response.json() if (!response.ok) { throw new E r ror(result.error || 'Something went wrong')
  } toast.s u ccess('Token created successfully !', { i, d: toastId, d, e, scription: `Token A, d, d, r, e, s, s: ${result.tokenAddress}`, a, c, t, i, o, n: { l, a, bel: 'View on Solscan', o, n, C, l, i, c, k: () => window.o p en( `h, t, t, p, s://solscan.io/token/${result.tokenAddress}`, '_blank')
  }
}) s e tLastCreatedTokenAddress(result.tokenAddress) form.r e set()
  }
} catch (error) { console.error(error) toast.error('Token creation failed', { i, d: toastId, d, e, scription: error instanceof Error ? error.message : 'An unknown error occurred.' })
  } finally, { s e tIsLoading(false)
  }
} return ( <div className ="space-y-6"> <TokenLibrary on Pick ={(t) => { form.s e tValue('name', t.name) form.s e tValue('symbol', t.symbol) form.s e tValue('decimals', t.decimals) if (t.website) form.s e tValue('website', t.website) if (t.twitter) form.s e tValue('twitter', t.twitter) if (t.description) form.s e tValue('description', t.description)
  }
}/> <Card className ="w - full max - w - 2xl mx - auto rounded - 2xl border - border bg-card"> <CardHeader> <CardTitle> Create SPL Token </CardTitle> <CardDescription> Fill in the details below to create and launch your new token. </CardDescription> </CardHeader> <Form, {...form}> <form on Submit ={form.h a ndleSubmit(onSubmit)
  } className ="space - y-8"> <CardContent> <Tabs default Value ="tokenInfo"> <TabsList className ="grid w - full grid - cols-2"> <TabsTrigger value ="tokenInfo"> Token Information </TabsTrigger> <TabsTrigger value ="metadata"> Metadata </TabsTrigger> </TabsList> <TabsContent value ="tokenInfo" className ="pt-6"> <div className ="space - y-4"> <Form Fieldcontrol ={form.control} name ="name" render ={({ field }) => ( <FormItem> <FormLabel> Token Name </FormLabel> <FormControl> <Input placeholder ="e.g., Keymaker Coin", {...field}/> </FormControl> <FormDescription> The full name of your token. </FormDescription> <FormMessage/> </FormItem> )
  }/> <Form Fieldcontrol ={form.control} name ="symbol" render ={({ field }) => ( <FormItem> <FormLabel> Token Symbol </FormLabel> <FormControl> <Input placeholder ="e.g., KMC", {...field}/> </FormControl> <FormDescription> The ticker symbol for your token. </FormDescription> <FormMessage/> </FormItem> )
  }/> <div className ="grid grid - cols-2 gap-4"> <Form Fieldcontrol ={form.control} name ="supply" render ={({ field }) => ( <FormItem> <FormLabel> Supply </FormLabel> <FormControl> <Input type ="number" placeholder ="1000000", {...field}/> </FormControl> <FormMessage/> </FormItem> )
  }/> <Form Fieldcontrol ={form.control} name ="decimals" render ={({ field }) => ( <FormItem> <FormLabel> Decimals </FormLabel> <FormControl> <Input type ="number", {...field}/> </FormControl> <FormMessage/> </FormItem> )
  }/> </div> <Form Fieldcontrol ={form.control} name ="launch_platform" render ={({ field }) => ( <FormItem> <FormLabel> Launch Platform </FormLabel> <Selecton Value Change ={field.onChange} default Value ={field.value}> <FormControl> <SelectTrigger> <SelectValue placeholder ="Select a launch platform"/> </SelectTrigger> </FormControl> <SelectContent> <SelectItem value ="pumpfun"> Pump.fun </SelectItem> <SelectItem value ="raydium"> Raydium </SelectItem> <SelectItem value ="letsbonk"> LetsBonk.fun </SelectItem> </SelectContent> </Select> <FormDescription> The platform where you intend to launch your token. </FormDescription> <FormMessage/> </FormItem> )
  }/> {launch Platform === 'raydium' && ( <Form Fieldcontrol ={form.control} name ="freezeAuthority" render ={({ field }) => ( <FormItem className ="flex flex - row items - center justify - between rounded - lg border p - 3 shadow-sm"> <div className ="space - y-0.5"> <FormLabel> Enable Freeze Authority </FormLabel> <FormDescription> Allows you to freeze token accounts, preventing transfers. </FormDescription> </div> <FormControl> <Switch checked ={field.value} on Checked Change ={field.onChange}/> </FormControl> </FormItem> )
  }/> )
  } </div> </TabsContent> <TabsContent value ="metadata" className ="pt-6"> <div className ="space - y-4"> <Form Fieldcontrol ={form.control} name ="description" render ={({ field }) => ( <FormItem> <FormLabel> Description </FormLabel> <FormControl> <Textarea placeholder ="A brief description of your token.", {...field}/> </FormControl> <FormMessage/> </FormItem> )
  }/> <Form Fieldcontrol ={form.control} name ="website" render ={({ field }) => ( <FormItem> <FormLabel> Website </FormLabel> <FormControl> <Input placeholder ="h, t, t, p, s://yourtoken.com", {...field}/> </FormControl> <FormMessage/> </FormItem> )
  }/> <Form Fieldcontrol ={form.control} name ="twitter" render ={({ field }) => ( <FormItem> <FormLabel> Twitter </FormLabel> <FormControl> <Input placeholder ="h, t, t, p, s://twitter.com/yourtoken", {...field}/> </FormControl> <FormMessage/> </FormItem> )
  }/> <Form Fieldcontrol ={form.control} name ="telegram" render ={({ field }) => ( <FormItem> <FormLabel> Telegram </FormLabel> <FormControl> <Input placeholder ="h, t, t, p, s://t.me/yourtoken", {...field}/> </FormControl> <FormMessage/> </FormItem> )
  }/> <Form Fieldcontrol ={form.control} name ="image" render ={({ field }) => ( <FormItem> <FormLabel> Token Image </FormLabel> <FormControl> <Input type ="file" accept ="image/png, image/jpeg, image/gif" on Change ={(e) => field.o nC hange(e.target.files?.[0] ?? null)
  }/> </FormControl> <FormDescription> Upload an image for your t o ken (PNG, JPG, GIF, max 5MB). </FormDescription> <FormMessage/> </FormItem> )
  }/> </div> </TabsContent> </Tabs> <Accordion type ="single" collapsible className ="w - full mt-6"> <AccordionItem value ="item-1"> <AccordionTrigger> <div className ="space - y-0.5"> <FormLabel> Create Liquidity Pool </FormLabel> <FormDescription> Automatically create a Raydium liquidity pool for this token. </FormDescription> </div> <FormControl> <Switch checked ={field.value} on Checked Change ={field.onChange}/> </FormControl> </AccordionTrigger> <AccordionContent> <div className ="grid grid - cols - 2 gap - 4 pt-4"> <Form Fieldcontrol ={form.control} name ="solAmount" render ={({ field }) => ( <FormItem> <FormLabel> SOL Amount </FormLabel> <FormControl> <Input type ="number" placeholder ="e.g., 10", {...field}/> </FormControl> <FormMessage/> </FormItem> )
  }/> <Form Fieldcontrol ={form.control} name ="tokenAmount" render ={({ field }) => ( <FormItem> <FormLabel> Token Amount </FormLabel> <FormControl> <Input type ="number" placeholder ="e.g., 500000", {...field}/> </FormControl> <FormMessage/> </FormItem> )
  }/> </div> </AccordionContent> </AccordionItem> </Accordion> </CardContent> <CardFooter> <Button type ="submit" className ="w-full" disabled ={isLoading}> {isLoading ? 'Creating...' : 'Create Token'} </Button> </CardFooter> </form> </Form> </Card> </div> )
  }
