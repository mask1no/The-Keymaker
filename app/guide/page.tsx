'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/UI/Card'
import { Button } from '@/components/UI/button'
import { Badge } from '@/components/UI/badge'
import {
  BookOpen,
  CheckCircle,
  ArrowRight,
  Zap,
  Package,
  Target,
  Shield,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Settings,
} from 'lucide-react'

export default function GuidePage() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['getting-started']),
  )

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const steps = [
    {
      title: 'Create Token',
      description:
        "Navigate to the SPL Creator page and define your token parameters (name, symbol, decimals, supply). After creation, you'll receive a confirmation with the token address and deployment slot.",
      icon: Package,
      details: [
        'Choose a unique token symbol (3-10 characters)',
        'Set appropriate decimals (usually 6-9)',
        'Define total supply in whole units',
        'Review gas costs and confirm creation',
      ],
    },
    {
      title: 'Configure Bundle',
      description:
        'Set up your bundle parameters including wallet group, region, execution mode, and tip strategy.',
      icon: Settings,
      details: [
        'Select wallet group (Neo recommended for production)',
        'Choose Jito region (ffm=Germany, nyc=USA, ams=Netherlands)',
        'Pick execution mode (Regular/Instant/Delayed)',
        'Configure tip parameters per mode',
      ],
    },
    {
      title: 'Preview Bundle',
      description:
        'Build and simulate your transaction bundle to ensure all transactions will succeed before execution.',
      icon: Target,
      details: [
        'Add transactions to your bundle (max 5 per bundle)',
        'Click "Preview Bundle" to simulate execution',
        'Review simulation results for any failures',
        'Fix failed transactions before proceeding',
      ],
    },
    {
      title: 'Execute Bundle',
      description:
        'Submit your validated bundle to Jito for atomic execution with MEV protection and guaranteed inclusion.',
      icon: Zap,
      details: [
        'Ensure all guardrails are satisfied',
        'Click "Execute Bundle" to submit',
        'Monitor real-time status in the UI',
        'View execution results and final latency',
      ],
    },
  ]

  const glossary = [
    {
      term: 'Lamports',
      definition:
        'The smallest unit of SOL currency (1 SOL = 1,000,000,000 lamports). All Solana fees, tips, and gas costs are denominated in lamports.',
      category: 'Currency',
    },
    {
      term: 'Tips',
      definition:
        'Priority fees paid to Jito validators for bundle processing. Higher tips = higher priority. Calculated as base tip × multiplier.',
      category: 'Execution',
    },
    {
      term: 'Bundles',
      definition:
        "Atomic groups of up to 5 transactions executed together with guaranteed ordering. Protected from MEV through Jito's block engine.",
      category: 'Execution',
    },
    {
      term: 'MEV',
      definition:
        'Maximal Extractable Value - profits from transaction ordering, arbitrage, and liquidation. Jito protects bundles from MEV extraction.',
      category: 'Concepts',
    },
    {
      term: 'Blockhash',
      definition:
        'Cryptographic hash of recent blockchain state. Transactions must reference fresh blockhashes (within ~3 seconds) to be valid.',
      category: 'Technical',
    },
    {
      term: 'Guardrails',
      definition:
        "Safety checks preventing bundle execution when prerequisites aren't met (wallet count, region health, preview success).",
      category: 'Safety',
    },
    {
      term: 'Regions',
      definition:
        'Jito block engine locations affecting latency. Choose closest region for best performance (ffm/ncy/ams).',
      category: 'Infrastructure',
    },
    {
      term: 'Stagger',
      definition:
        'Inter-bundle delay preventing rate limiting. Regular: 60ms, Instant: random 0-10ms, Delayed: configurable.',
      category: 'Execution',
    },
    {
      term: 'Wallet Groups',
      definition:
        'Organized wallet collections (Neo: 19 active wallets). Different groups for different strategies and risk levels.',
      category: 'Management',
    },
  ]

  const troubleshooting = [
    {
      issue: 'Execute button disabled',
      solution:
        'Check guardrails: ensure Neo wallet group selected, region healthy, preview passed, blockhash fresh.',
    },
    {
      issue: 'Bundle preview fails',
      solution:
        'Verify wallet balances, token accounts exist, and all required programs are initialized.',
    },
    {
      issue: 'High latency in region',
      solution:
        'Switch to closer region or check regional performance in P&L analytics.',
    },
    {
      issue: 'Token creation stuck',
      solution:
        'Wait for slot confirmation, check Solscan, ensure sufficient SOL for gas fees.',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
          <BookOpen className="h-8 w-8" />
          User Guide
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Complete guide to The Keymaker for Solana bundle execution and MEV
          protection
        </p>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-auto p-4 flex-col gap-2"
                onClick={() => (window.location.href = '/creator')}
              >
                <Package className="h-6 w-6" />
                <span className="font-medium">Create Token</span>
                <span className="text-xs text-muted-foreground">
                  Start here
                </span>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex-col gap-2"
                onClick={() => (window.location.href = '/bundle')}
              >
                <Zap className="h-6 w-6" />
                <span className="font-medium">Bundle Engine</span>
                <span className="text-xs text-muted-foreground">
                  Execute trades
                </span>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex-col gap-2"
                onClick={() => (window.location.href = '/settings')}
              >
                <Shield className="h-6 w-6" />
                <span className="font-medium">Settings</span>
                <span className="text-xs text-muted-foreground">Configure</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Getting Started */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader>
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('getting-started')}
            >
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Getting Started Guide
              </CardTitle>
              {expandedSections.has('getting-started') ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </div>
          </CardHeader>

          {expandedSections.has('getting-started') && (
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                The Keymaker is a thin cockpit for Solana execution. The UI
                orchestrates while the server handles all heavy lifting. Follow
                these steps to get started with bundle creation and execution.
              </p>

              {steps.map((step, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <step.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Step {index + 1}
                        </Badge>
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground mb-3">
                        {step.description}
                      </p>

                      <div className="space-y-1">
                        {step.details.map((detail, detailIndex) => (
                          <div
                            key={detailIndex}
                            className="flex items-center gap-2 text-sm text-muted-foreground"
                          >
                            <ArrowRight className="h-3 w-3 flex-shrink-0" />
                            {detail}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {index < steps.length - 1 && (
                    <div className="flex justify-center py-4">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      </motion.div>

      {/* Glossary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader>
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('glossary')}
            >
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Glossary
              </CardTitle>
              {expandedSections.has('glossary') ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </div>
          </CardHeader>

          {expandedSections.has('glossary') && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {glossary.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-card/30 border border-border/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-primary">
                        {item.term}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.definition}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      </motion.div>

      {/* Troubleshooting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader>
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('troubleshooting')}
            >
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Troubleshooting
              </CardTitle>
              {expandedSections.has('troubleshooting') ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </div>
          </CardHeader>

          {expandedSections.has('troubleshooting') && (
            <CardContent className="space-y-4">
              {troubleshooting.map((item, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-card/30 border border-border/50"
                >
                  <h4 className="font-semibold text-amber-400 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {item.issue}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {item.solution}
                  </p>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      </motion.div>

      {/* Best Practices */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-primary">
                  Bundle Optimization
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    • Keep bundles ≤5 transactions for optimal performance
                  </li>
                  <li>
                    • Use appropriate tip levels (P50 × 1.2 for Regular mode)
                  </li>
                  <li>• Always preview bundles before execution</li>
                  <li>• Monitor region latency and switch if needed</li>
                  <li>• Use Neo wallet group for production trading</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-primary">
                  Safety & Reliability
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    • Wait for token creation confirmation before bundling
                  </li>
                  <li>• Keep sufficient SOL balance for fees and tips</li>
                  <li>• Monitor system health in the status bento</li>
                  <li>• Use delayed mode for high-value transactions</li>
                  <li>• Review P&L analytics for performance insights</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Troubleshooting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <Card className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Troubleshooting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-primary">
                  Execute Button Disabled
                </h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <strong>Preview not passed:</strong> Always click Preview
                    before Execute to validate bundle
                  </p>
                  <p>
                    <strong>Too many transactions:</strong> Bundles must have ≤5
                    transactions. Check bundle planner.
                  </p>
                  <p>
                    <strong>Stale blockhash:</strong> Server fetches fresh
                    blockhash within 3s. Try again if timeout.
                  </p>
                  <p>
                    <strong>No active wallets:</strong> Select Neo group (19
                    wallets) or ensure wallet group has active wallets.
                  </p>
                  <p>
                    <strong>Health status not healthy:</strong> Check status
                    bento - RPC, WS, and Jito must be green.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-primary">
                  Invalid Bundle / AccountInUse
                </h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <strong>Keep conflict_aware:</strong> Use same wallet group
                    to reduce account conflicts
                  </p>
                  <p>
                    <strong>Reduce same-pool collisions:</strong> Spread
                    transactions across different account pools
                  </p>
                  <p>
                    <strong>Try Instant mode:</strong> Higher priority for
                    faster execution if racing other bundles
                  </p>
                  <p>
                    <strong>Check tip levels:</strong> Ensure tip is sufficient
                    for current network congestion
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-primary">
                  RPC Connection Issues
                </h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <strong>Status bento shows RPC red:</strong> Switch region
                    (FFM/AMS/LDN) in bundle controls
                  </p>
                  <p>
                    <strong>High latency:</strong> RPC status turns amber when
                    latency &gt;400ms. Switch regions.
                  </p>
                  <p>
                    <strong>WebSocket stale:</strong> WS status shows latency in
                    status bento. Restart dev server if stuck.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-primary">Tip Too Low</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <strong>Bump tip level:</strong> Use P75 × 1.25 for Regular
                    mode or raise max tip clamp
                  </p>
                  <p>
                    <strong>Switch to Instant mode:</strong> Higher tip
                    multiplier (P75 × 1.25) for urgent execution
                  </p>
                  <p>
                    <strong>Check tip floor API:</strong> Verify
                    /api/jito/tipfloor returns current market rates
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-primary">
                  Empty History/P&L
                </h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <strong>No bundles executed:</strong> Execute your first
                    bundle to populate history
                  </p>
                  <p>
                    <strong>API not responding:</strong> Check /api/history and
                    /api/pnl endpoints
                  </p>
                  <p>
                    <strong>Database empty:</strong> Execution logs are stored
                    in SQLite. Check db file.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-primary">Performance & UX</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <strong>Slow navigation:</strong> SideNav links use prefetch
                    for instant page loads
                  </p>
                  <p>
                    <strong>Button lag:</strong> Heavy operations use
                    React.startTransition for smooth UI
                  </p>
                  <p>
                    <strong>Status not updating:</strong> Status bento refreshes
                    every 3s from /api/jito/tipfloor
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
