'use client';

import WalletManager from '@/components/WalletManager/WalletManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card';
import { Badge } from '@/components/UI/badge';

export default function WalletsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100">Wallet Manager</h1>
          <p className="text-zinc-400 mt-2">Organize your trading wallets into groups</p>
        </div>
        <Badge variant="outline" className="border-green-500 text-green-400">
          🔒 Encrypted Locally
        </Badge>
      </div>

      {/* Info Card */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">How It Works</CardTitle>
          <CardDescription className="text-zinc-400">
            Secure wallet management with local encryption
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <h3 className="font-medium text-zinc-200">📁 Wallet Groups</h3>
              <p className="text-zinc-400">Create folders to organize your wallets by strategy or purpose</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-zinc-200">🔐 Local Encryption</h3>
              <p className="text-zinc-400">All private keys are encrypted locally with your password</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-zinc-200">⚡ Quick Access</h3>
              <p className="text-zinc-400">Set active wallets for instant trading operations</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Manager Component */}
      <WalletManager />
    </div>
  );
}