'use client';
import React, { useState } from 'react';
import { useKeymakerStore, ExecutionStep } from '@/lib/store';
import { Connection, LAMPORTS_PER_SOL, Keypair } from '@solana/web3.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card';
import { Button } from '@/components/UI/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/UI/select';
import { Badge } from '@/components/UI/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/UI/dialog';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';
import { Rocket, PlayCircle, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { NEXT_PUBLIC_HELIUS_RPC } from '@/constants';
import { fundWalletGroup } from '@/services/fundingService';
import { executeBundle } from '@/services/bundleService';
import { executeSellPlan } from '@/services/sellService';
import { createToken } from '@/services/platformService';
import { getKeypair } from '@/services/walletService';

export function ControlCenter() {
  const {
    wallets,
    tokenLaunchData,
    executionStrategy,
    executionSteps,
    isExecuting,
    jitoEnabled,
    tipAmount,
    autoSellDelay,
    setExecutionStrategy,
    startExecution,
    updateStepStatus,
    resetExecution
  } = useKeymakerStore();

  const connection = new Connection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed');
  const [currentStep, setCurrentStep] = useState(0);
  const [walletPassword, setWalletPassword] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [decryptedWallets, setDecryptedWallets] = useState<Map<string, Keypair>>(new Map());

  // Get wallets by role
  const masterWallet = wallets.find(w => w.role === 'master');
  const devWallets = wallets.filter(w => w.role === 'dev');
  const sniperWallets = wallets.filter(w => w.role === 'sniper');

  // Calculate progress
  const completedSteps = executionSteps.filter(s => s.status === 'completed').length;
  const progress = (completedSteps / executionSteps.length) * 100;

  // Decrypt wallets with password
  const decryptWallets = async (password: string) => {
    const decrypted = new Map<string, Keypair>();
    
    for (const wallet of wallets) {
      if (wallet.encryptedPrivateKey) {
        try {
          const keypair = await getKeypair({
            ...wallet,
            encryptedPrivateKey: wallet.encryptedPrivateKey
          } as any, password);
          if (keypair) {
            decrypted.set(wallet.publicKey, keypair);
          }
        } catch (error) {
          console.error(`Failed to decrypt wallet ${wallet.publicKey}:`, error);
        }
      }
    }
    
    return decrypted;
  };

  // Execute the orchestration flow
  const executeKeymaker = async () => {
    // First check if we need to decrypt wallets
    const needsDecryption = wallets.some(w => w.encryptedPrivateKey && !decryptedWallets.has(w.publicKey));
    
    if (needsDecryption) {
      setShowPasswordDialog(true);
      return;
    }
    
    await runExecution();
  };

  const handlePasswordSubmit = async () => {
    if (!walletPassword) {
      toast.error('Password is required');
      return;
    }
    
    try {
      const decrypted = await decryptWallets(walletPassword);
      if (decrypted.size === 0) {
        toast.error('Invalid password or no wallets to decrypt');
        return;
      }
      
      setDecryptedWallets(decrypted);
      setShowPasswordDialog(false);
      setWalletPassword('');
      
      // Continue with execution
      await runExecution();
    } catch (error) {
      toast.error('Failed to decrypt wallets');
    }
  };

  const runExecution = async () => {
    // Get wallets with decrypted keypairs
    const getWalletWithKeypair = (publicKey: string) => {
      const wallet = wallets.find(w => w.publicKey === publicKey);
      if (!wallet) return null;
      
      const keypair = decryptedWallets.get(publicKey) || wallet.keypair;
      return { ...wallet, keypair };
    };
    
    const masterWallet = wallets.find(w => w.role === 'master');
    const masterWithKeypair = masterWallet ? getWalletWithKeypair(masterWallet.publicKey) : null;
    
    if (!masterWithKeypair?.keypair) {
      toast.error('No master wallet with keypair available');
      return;
    }

    if (!tokenLaunchData) {
      toast.error('No token launch data configured');
      return;
    }

    const sniperWallets = wallets
      .filter(w => w.role === 'sniper')
      .map(w => getWalletWithKeypair(w.publicKey))
      .filter(w => w && w.keypair) as any[];

    if (sniperWallets.length === 0) {
      toast.error('No sniper wallets with keypairs available');
      return;
    }

    startExecution();
    setCurrentStep(0);

    try {
      // Step 1: Deploy Token
      updateStepStatus('deploy', 'running', 'Deploying token...');
      
      const launchWallet = wallets.find(w => w.publicKey === tokenLaunchData.walletPublicKey);
      if (!launchWallet?.keypair) {
        throw new Error('Launch wallet not found');
      }

      const tokenResult = await createToken({
        creator: launchWallet.keypair,
        name: tokenLaunchData.name,
        symbol: tokenLaunchData.symbol,
        decimals: tokenLaunchData.decimals,
        supply: tokenLaunchData.supply,
        platform: tokenLaunchData.platform,
        lpAmount: tokenLaunchData.lpAmount,
        description: `${tokenLaunchData.name} - Created with The Keymaker`,
        socials: {}
      });

      if (!tokenResult.success) {
        throw new Error(tokenResult.error || 'Token creation failed');
      }

      updateStepStatus('deploy', 'completed', `Token deployed: ${tokenResult.mintAddress}`);
      setCurrentStep(1);

      // Step 2: Fund Wallets
      updateStepStatus('fund', 'running', 'Funding sniper wallets...');
      
      const fundingResult = await fundWalletGroup(
        masterWithKeypair.keypair,
        sniperWallets.map(w => ({ publicKey: w.publicKey, role: w.role })),
        10,  // total funding
        0.5, // min SOL
        2.0, // max SOL
        connection
      );

      if (!fundingResult || fundingResult.length === 0) {
        throw new Error('Funding failed');
      }

      updateStepStatus('fund', 'completed', `Funded ${fundingResult.length} wallets`);
      setCurrentStep(2);

      // Step 3: Wait
      updateStepStatus('wait-funding', 'running', 'Waiting for funds to settle...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      updateStepStatus('wait-funding', 'completed');
      setCurrentStep(3);

      // Step 4: Bundle Buys
      updateStepStatus('bundle', 'running', 'Executing bundle buys...');
      
      // TODO: Create actual swap transactions here
      // For now, we'll simulate bundle execution
      const transactions: any[] = []; // Would be populated with actual swap transactions
      const signers = sniperWallets.map(w => w.keypair!).filter(Boolean);
      const walletRoles = sniperWallets.map(w => ({ 
        publicKey: w.publicKey, 
        role: w.role 
      }));

      const bundleResult = await executeBundle(
        transactions,
        walletRoles,
        signers,
        {
          connection,
          tipAmount: tipAmount * LAMPORTS_PER_SOL,
          logger: (msg) => console.log(`[Bundle] ${msg}`)
        }
      );

      updateStepStatus('bundle', 'completed', `Bundle executed: ${bundleResult.metrics.successRate * 100}% success`);
      setCurrentStep(4);

      // Step 5: Wait before selling
      if (executionStrategy !== 'manual') {
        updateStepStatus('wait-sells', 'running', `Waiting ${autoSellDelay}s before selling...`);
        for (let i = autoSellDelay; i > 0; i--) {
          updateStepStatus('wait-sells', 'running', `Waiting ${i}s before selling...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        updateStepStatus('wait-sells', 'completed');
        setCurrentStep(5);

        // Step 6: Sell
        updateStepStatus('sell', 'running', 'Executing sells from sniper wallets...');
        
        const sellResult = await executeSellPlan({
          wallets: sniperWallets.map(w => w.keypair!).filter(Boolean),
          tokenMint: tokenResult.mintAddress!,
          connection,
          sellCondition: { timeDelay: 0 }
        });

        updateStepStatus('sell', 'completed', `Sold from ${sellResult.successCount} wallets`);
      } else {
        updateStepStatus('wait-sells', 'completed', 'Manual mode - skipping auto-sell');
        updateStepStatus('sell', 'completed', 'Manual mode - user controls sells');
      }

      // Step 7: Complete
      updateStepStatus('complete', 'completed', 'Keymaker execution complete!');
      toast.success('🔑 Keymaker execution complete!');
      
    } catch (error) {
      const step = executionSteps[currentStep];
      updateStepStatus(step.id, 'failed', (error as Error).message);
      toast.error(`Execution failed: ${(error as Error).message}`);
      
      // Mark remaining steps as failed
      executionSteps.slice(currentStep + 1).forEach(s => {
        updateStepStatus(s.id, 'failed', 'Skipped due to previous error');
      });
    }
  };

  // Strategy descriptions
  const strategyDescriptions = {
    flash: '⚡ All actions execute immediately in rapid succession',
    stealth: '🥷 Delayed sniper buys with randomized timing',
    manual: '🎮 User-controlled execution at each step'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-6 w-6" />
            Keymaker Control Center
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Strategy Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Execution Strategy</label>
            <Select
              value={executionStrategy}
              onValueChange={(value) => setExecutionStrategy(value as any)}
              disabled={isExecuting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flash">⚡ Flash Launch</SelectItem>
                <SelectItem value="stealth">🥷 Stealth Ramp</SelectItem>
                <SelectItem value="manual">🎮 Manual Mode</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {strategyDescriptions[executionStrategy]}
            </p>
          </div>

          {/* Pre-flight Checks */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Pre-flight Checks</h3>
            <div className="space-y-1">
              <CheckItem 
                label="Master Wallet" 
                checked={!!masterWallet} 
                detail={masterWallet ? `${(masterWallet.balance / LAMPORTS_PER_SOL).toFixed(2)} SOL` : 'Not assigned'}
              />
              <CheckItem 
                label="Dev Wallets" 
                checked={devWallets.length > 0} 
                detail={`${devWallets.length} wallets`}
              />
              <CheckItem 
                label="Sniper Wallets" 
                checked={sniperWallets.length > 0} 
                detail={`${sniperWallets.length} wallets`}
              />
              <CheckItem 
                label="Token Config" 
                checked={!!tokenLaunchData} 
                detail={tokenLaunchData ? `${tokenLaunchData.symbol} on ${tokenLaunchData.platform}` : 'Not configured'}
              />
              <CheckItem 
                label="Jito Bundle" 
                checked={jitoEnabled} 
                detail={jitoEnabled ? `${tipAmount} SOL tip` : 'Disabled'}
              />
            </div>
          </div>

          {/* Execute Button */}
          <Button
            size="lg"
            className="w-full"
            onClick={executeKeymaker}
            disabled={isExecuting || !masterWallet || !tokenLaunchData || sniperWallets.length === 0}
          >
            {isExecuting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-5 w-5" />
                🔑 Execute Keymaker
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Execution Progress */}
      {(isExecuting || executionSteps.some(s => s.status !== 'pending')) && (
        <Card>
          <CardHeader>
            <CardTitle>Execution Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            <div className="space-y-2">
              <AnimatePresence mode="sync">
                {executionSteps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <StepItem step={step} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {executionSteps.every(s => s.status === 'completed' || s.status === 'failed') && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={resetExecution}
              >
                Reset Execution
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Wallet Password</DialogTitle>
            <DialogDescription>
              Please enter the password to decrypt your wallets for execution.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={walletPassword}
                onChange={(e) => setWalletPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                placeholder="Enter your wallet password"
              />
            </div>
            <Button onClick={handlePasswordSubmit} className="w-full">
              Decrypt Wallets
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper Components
function CheckItem({ label, checked, detail }: { label: string; checked: boolean; detail: string }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
      <div className="flex items-center gap-2">
        {checked ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-xs text-muted-foreground">{detail}</span>
    </div>
  );
}

function StepItem({ step }: { step: ExecutionStep }) {
  const statusIcons: Record<ExecutionStep['status'], React.ReactElement> = {
    pending: <AlertCircle className="h-4 w-4 text-muted-foreground" />,
    running: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />,
    completed: <CheckCircle className="h-4 w-4 text-green-500" />,
    failed: <XCircle className="h-4 w-4 text-red-500" />
  };

  const statusColors: Record<ExecutionStep['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'default',
    running: 'secondary',
    completed: 'outline',
    failed: 'destructive'
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
      <div className="flex items-center gap-3">
        {statusIcons[step.status]}
        <span className="font-medium">{step.name}</span>
      </div>
      <div className="flex items-center gap-2">
        {step.message && (
          <span className="text-xs text-muted-foreground max-w-[200px] truncate">
            {step.message}
          </span>
        )}
        <Badge variant={statusColors[step.status]}>
          {step.status}
        </Badge>
      </div>
    </div>
  );
} 