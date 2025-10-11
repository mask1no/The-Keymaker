'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { Badge } from '@/components/UI/badge';
import { CheckCircle } from 'lucide-react';

export default function EnginePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100">Trading Engine</h1>
          <p className="text-zinc-400 mt-2">
            Advanced trading engine with RPC and Jito integration
          </p>
        </div>
        <Badge variant="outline" className="border-green-500 text-green-400">
          <CheckCircle className="h-3 w-3 mr-1" />
          Engine Ready
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">RPC Trading</CardTitle>
            <CardDescription className="text-zinc-400">Standard RPC-based trading</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-300 mb-4">
              Execute trades using standard Solana RPC endpoints with configurable concurrency.
            </p>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Configure RPC
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Jito Bundles</CardTitle>
            <CardDescription className="text-zinc-400">Fast transaction execution</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-300 mb-4">
              Use Jito bundles for faster transaction execution with priority fees.
            </p>
            <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
              Configure Jito
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Volume Bot</CardTitle>
            <CardDescription className="text-zinc-400">Automated volume generation</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-300 mb-4">
              Set up automated buy/sell loops to generate volume for your tokens.
            </p>
            <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
              Setup Volume Bot
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Engine Status</CardTitle>
          <CardDescription className="text-zinc-400">
            Current engine configuration and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">RPC</div>
              <div className="text-sm text-zinc-400">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">Jito</div>
              <div className="text-sm text-zinc-400">Ready</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">Volume</div>
              <div className="text-sm text-zinc-400">0 Tasks</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
