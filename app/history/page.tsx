'use client'
export const dynamic = 'force-dynamic'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card'
import { LogsPanel } from '@/components/ExecutionLog/LogsPanel'

export default function HistoryPage(){
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Trade History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No attempts yet.</p>
        </CardContent>
      </Card>
      <LogsPanel />
    </div>
  )
}


