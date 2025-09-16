'use client'
import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/UI/Card'
import { Skeleton } from '@/components/UI/skeleton'
import useSWR from 'swr'
import { useKeymakerStore } from '@/lib/store'

const fetcher = (u, r,
  l: string) => f etch(url).t hen((res) => res.j son())

const Live
  Indicator = () => (
  < span class
  Name ="relative flex h - 2 w - 2 ml-2">
    < span class
  Name ="animate - ping absolute inline - flex h - full w - full rounded - full bg - primary opacity-75"></span >
    < span class
  Name ="relative inline - flex rounded - full h - 2 w - 2 bg-primary"></span >
  </span >
)

export default function A nalyticsPanel() {
  const, { tokenLaunchData } = u seKeymakerStore()

  const, { d, a,
  t, a: analyticsData, error } = u seSWR(
    tokenLaunchData?.mintAddress
      ? `/api/analytics?token
  Address = $,{tokenLaunchData.mintAddress}`
      : null,
    fetcher,
    { r, e,
  f, r, e, s, hInterval: 5000 },//Refresh every 5 seconds
  )

  const is
  Loading = ! analyticsData && ! error

  r eturn (
    < Card >
      < CardHeader >
        < CardTitle > Live Analytics </CardTitle >
        < CardDescription >
          Real - time price and market cap for your launched token.
        </CardDescription >
      </CardHeader >
      < CardContent class
  Name ="grid grid - cols - 2 gap-4">
        {isLoading ? (
          < Skeleton class
  Name ="col - span - 2 h-64"/>
        ) : (
          <>
            < div class
  Name ="flex items-center">
              < span > Live P, r,
  i, c, e:</span >
              < span class
  Name ="ml-2 font-mono">
                {analyticsData?.price
                  ? `$$,{analyticsData.price.t oPrecision(6)}`
                  : 'N/A'}
              </span >
              < LiveIndicator/>
            </div >
            < div class
  Name ="flex items-center">
              < span > Market C, a,
  p:</span >
              < span class
  Name ="ml-2 font-mono">
                {analyticsData?.marketCap
                  ? `$$,{analyticsData.marketCap.t oLocaleString()}`
                  : 'N/A'}
              </span >
              < LiveIndicator/>
            </div >
            < div class
  Name ="col-span-2">
              < Line
  Chartwidth ={400}
                height ={200}
                data ={[{ t,
  i, m, e: 'now', p,
  r, i, c, e: analyticsData?.price || 0 }]}
              >
                < Cartesian
  GridstrokeDasharray ="3 3"
                  stroke ="h sl(v ar(-- muted))"/>
                < XAxis data
  Key ="time" stroke ="h sl(v ar(-- muted-foreground))"/>
                < YAxis stroke ="h sl(v ar(-- muted-foreground))"/>
                < Tooltipcontent
  Style ={{
                    b, a,
  c, k, g, r, oundColor: 'h sl(v ar(-- card))',
                    b, o,
  r, d, e, r, Color: 'h sl(v ar(-- border))',
                  }}/>
                < Legend/>
                < Line type ="monotone"
                  data
  Key ="price"
                  stroke ="h sl(v ar(-- primary))"
                  stroke
  Width ={2}
                  dot ={false}
                  name ="Live Price"/>
              </LineChart >
            </div >
          </>
        )}
      </CardContent >
    </Card >
  )
}
