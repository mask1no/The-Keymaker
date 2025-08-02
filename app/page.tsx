'use client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/UI/button';
import { Card } from '@/components/UI/card';
import { Rocket, Wallet, Package, TrendingUp, FileText, Settings } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  const features = [
    {
      icon: <Wallet className="h-8 w-8" />,
      title: 'Wallet Management',
      description: 'Manage wallet groups with roles and automated funding',
      href: '/wallets'
    },
    {
      icon: <Rocket className="h-8 w-8" />,
      title: 'Token Launch',
      description: 'Deploy tokens on pump.fun, letsbonk, or Raydium',
      href: '/spl-creator'
    },
    {
      icon: <Package className="h-8 w-8" />,
      title: 'Bundle Engine',
      description: 'Execute bundled transactions with Jito integration',
      href: '/bundle'
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: 'PnL Tracking',
      description: 'Real-time profit and loss monitoring',
      href: '/pnl'
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: 'Execution Logs',
      description: 'Detailed logs of all operations',
      href: '/logs'
    },
    {
      icon: <Settings className="h-8 w-8" />,
      title: 'Control Center',
      description: 'Orchestrate the entire Keymaker flow',
      href: '/home'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-black to-green-950">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-7xl font-bold text-white mb-4">
            The Keymaker
          </h1>
          <p className="text-2xl text-green-400 mb-8">
            Production-Ready Solana Memecoin Orchestration Engine
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => router.push('/home')}
            >
              <Rocket className="mr-2 h-5 w-5" />
              Launch Control Center
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="text-white border-white hover:bg-white hover:text-black"
              onClick={() => router.push('/wallets')}
            >
              <Wallet className="mr-2 h-5 w-5" />
              Manage Wallets
            </Button>
          </div>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card 
                className="p-6 bg-black/40 border-green-600/30 hover:border-green-400/50 transition-all cursor-pointer backdrop-blur-sm"
                onClick={() => router.push(feature.href)}
              >
                <div className="text-green-400 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400">
                  {feature.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Status Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-600/20 rounded-full border border-green-600/30">
            <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-sm">
              System Ready • Connected to Solana Mainnet
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 