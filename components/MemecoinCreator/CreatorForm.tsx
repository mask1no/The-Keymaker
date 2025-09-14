'use client'

import { useForm } from 'react-hook-form'
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/UI/Tabs'
import { useState } from 'react'
import { Switch } from '@/components/UI/switch'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/UI/Accordion'

type CreatorFormValues = {
  name: string;
  symbol: string;
  supply: number;
  decimals: number;
  launch_platform: 'pumpfun' | 'raydium';
  description?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  image: any;
  createLiquidityPool: boolean;
  solAmount?: number;
  tokenAmount?: number;
};

const defaultValues: Partial<CreatorFormValues> = {
  decimals: 9,
  launch_platform: 'pumpfun',
}

export function CreatorForm() {
  const [isLoading, setIsLoading] = useState(false)
  const form = useForm<CreatorFormValues>({
    defaultValues,
    mode: 'onChange',
  })

  async function onSubmit(data: CreatorFormValues) {
    if (!data.name || data.name.length < 2) {
      toast.error('Token name must be at least 2 characters.');
      return;
    }
    if (!data.symbol || data.symbol.length < 2) {
      toast.error('Token symbol must be at least 2 characters.');
      return;
    }
    if (!data.supply || data.supply < 1) {
      toast.error('Supply must be at least 1.');
      return;
    }
    if (data.decimals < 0 || data.decimals > 18) {
        toast.error('Decimals must be between 0 and 18.');
        return;
    }
    if (data.createLiquidityPool && (!data.solAmount || data.solAmount <= 0 || !data.tokenAmount || data.tokenAmount <= 0)) {
        toast.error("SOL and Token amounts are required to create a liquidity pool.");
        return;
    }

    setIsLoading(true)
    const toastId = toast.loading('Creating your token... Please wait.')

    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value as any)
        }
      })

      const response = await fetch('/api/tokens', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Something went wrong')
      }

      toast.success('Token created successfully!', {
        id: toastId,
        description: `Token Address: ${result.tokenAddress}`,
        action: {
          label: 'View on Solscan',
          onClick: () =>
            window.open(
              `https://solscan.io/token/${result.tokenAddress}`,
              '_blank',
            ),
        },
      })
      form.reset()
    } catch (error) {
      console.error(error)
      toast.error('Token creation failed', {
        id: toastId,
        description:
          error instanceof Error ? error.message : 'An unknown error occurred.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create SPL Token</CardTitle>
        <CardDescription>
          Fill in the details below to create and launch your new token.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <CardContent>
            <Tabs defaultValue="tokenInfo">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="tokenInfo">Token Information</TabsTrigger>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
              </TabsList>
              <TabsContent value="tokenInfo" className="pt-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Token Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Keymaker Coin" {...field} />
                        </FormControl>
                        <FormDescription>
                          The full name of your token.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="symbol"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Token Symbol</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., KMC" {...field} />
                        </FormControl>
                        <FormDescription>
                          The ticker symbol for your token.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="supply"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supply</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="1000000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="decimals"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Decimals</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="launch_platform"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Launch Platform</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a launch platform" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pumpfun">Pump.fun</SelectItem>
                            <SelectItem value="raydium">Raydium</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The platform where you intend to launch your token.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
              <TabsContent value="metadata" className="pt-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="A brief description of your token."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input placeholder="https://yourtoken.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="twitter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twitter</FormLabel>
                        <FormControl>
                          <Input placeholder="https://twitter.com/yourtoken" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="telegram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telegram</FormLabel>
                        <FormControl>
                          <Input placeholder="https://t.me/yourtoken" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Token Image</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/png, image/jpeg, image/gif"
                            onChange={(e) =>
                              field.onChange(e.target.files?.[0] ?? null)
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Upload an image for your token (PNG, JPG, GIF, max 5MB).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <Accordion type="single" collapsible className="w-full mt-6">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                  <div className="flex items-center space-x-2">
                    <FormField
                      control={form.control}
                      name="createLiquidityPool"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                           <div className="space-y-0.5">
                            <FormLabel>Create Liquidity Pool</FormLabel>
                            <FormDescription>
                              Automatically create a Raydium liquidity pool for this token.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <FormField
                      control={form.control}
                      name="solAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SOL Amount</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g., 10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tokenAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Token Amount</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g., 500000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Token'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
