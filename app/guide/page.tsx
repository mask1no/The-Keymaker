'use client'
export const dynamic = 'force-dynamic'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card'
import { BookOpen, CheckCircle, ArrowRight, Zap } from 'lucide-react'

export default function GuidePage() {
  const steps = [
    {
      title: 'Create Token',
      description: 'Start by creating your SPL token using the SPL Creator page. Define your token parameters and deploy to mainnet.',
      icon: CheckCircle
    },
    {
      title: 'Preview Bundle',
      description: 'Use the Bundler to build your transaction bundle. Preview simulates all transactions to ensure they will succeed.',
      icon: CheckCircle
    },
    {
      title: 'Execute Bundle',
      description: 'Submit your validated bundle to Jito Block Engine. Monitor the status until landing confirmation.',
      icon: Zap
    }
  ]

  const glossary = [
    {
      term: 'Lamports',
      definition: 'The smallest unit of SOL (1 SOL = 1,000,000,000 lamports). Used for fees and tips.'
    },
    {
      term: 'Bundle',
      definition: 'A collection of up to 5 related transactions submitted together to Jito Block Engine for atomic execution.'
    },
    {
      term: 'Tip',
      definition: 'A small payment to the Jito validator that processes your bundle. Higher tips increase priority.'
    },
    {
      term: 'Blockhash',
      definition: 'A cryptographic hash of the current blockchain state. Transactions must reference a recent blockhash to be valid.'
    },
    {
      term: 'Simulation',
      definition: 'Testing a transaction against the current blockchain state without actually executing it.'
    }
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Guide</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            The Keymaker is a thin cockpit for Solana execution. The UI orchestrates while the server handles all heavy lifting.
            Follow these steps to get started with bundle creation and execution.
          </p>

          <div className="space-y-4">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={index} className="flex items-start gap-4 p-4 rounded-lg border border-border">
                  <div className="flex-shrink-0">
                    <Icon className="w-8 h-8 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <ArrowRight className="w-5 h-5 text-muted-foreground mt-1" />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Glossary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {glossary.map((item, index) => (
              <div key={index} className="border-l-2 border-border pl-4">
                <h4 className="font-semibold text-foreground mb-1">{item.term}</h4>
                <p className="text-muted-foreground text-sm">{item.definition}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tips & Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-muted-foreground">
            <li>• Always preview your bundle before execution to catch simulation errors</li>
            <li>• Higher tips improve your bundle's priority but cost more</li>
            <li>• Keep bundles small (≤5 transactions) for optimal performance</li>
            <li>• Monitor your health status before submitting bundles</li>
            <li>• Use appropriate wallet groups for different execution strategies</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}