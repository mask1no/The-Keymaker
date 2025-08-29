'use client'
export const dynamic = 'force-dynamic'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card'
import { Button } from '@/components/UI/button'
import { Input } from '@/components/UI/input'
import { Label } from '@/components/UI/label'
import { useState } from 'react'

export default function CreatorPage() {
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [decimals, setDecimals] = useState('9')
  const [supply, setSupply] = useState('1000000000')

  const onCreate = async () => {
    // Placeholder: wire to creation flow
    alert('Creation submitted (stub)')
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>SPL Creator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e)=>setName(e.target.value)} />
          </div>
          <div>
            <Label>Symbol</Label>
            <Input value={symbol} onChange={(e)=>setSymbol(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Decimals</Label>
              <Input type="number" value={decimals} onChange={(e)=>setDecimals(e.target.value)} />
            </div>
            <div>
              <Label>Supply</Label>
              <Input type="number" value={supply} onChange={(e)=>setSupply(e.target.value)} />
            </div>
          </div>
          <Button onClick={onCreate}>Create</Button>
        </CardContent>
      </Card>
    </div>
  )
}
// Legacy duplicate content removed
