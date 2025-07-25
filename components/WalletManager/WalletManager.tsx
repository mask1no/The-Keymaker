'use client';
import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, Keypair } from '@solana/web3.js';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { createWallet } from '../../services/walletService';
import { fundWalletGroup, getWalletBalances } from '../../services/fundingService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card';
import { Input } from '@/components/UI/input';
import { Button } from '@/components/UI/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/UI/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/UI/dialog';
import { Checkbox } from '@/components/UI/checkbox';
import { Skeleton } from '@/components/UI/skeleton';
import { Badge } from '@/components/UI/badge';
import { Copy, Download, Key, RefreshCw, Users, Wallet } from 'lucide-react';
import { NEXT_PUBLIC_HELIUS_RPC } from '../../constants';

type WalletRole = 'master' | 'dev' | 'sniper' | 'normal';

interface WalletData {
  publicKey: string;
  role: WalletRole;
  balance: number;
  createdAt: string;
  encryptedPrivateKey: string;
  keypair?: Keypair;
}

interface WalletGroup {
  name: string;
  wallets: WalletData[];
  createdAt: string;
}

export default function WalletManager() {
  const { publicKey: connectedWallet } = useWallet();
  const connection = new Connection(NEXT_PUBLIC_HELIUS_RPC, 'confirmed');
  
  const [groups, setGroups] = useState<{ [key: string]: WalletGroup }>({});
  const [activeGroup, setActiveGroup] = useState('default');
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Form states
  const [newGroupName, setNewGroupName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<WalletRole>('normal');
  const [totalFunding, setTotalFunding] = useState('10');
  const [minSol, setMinSol] = useState('0.5');
  const [maxSol, setMaxSol] = useState('2');
  
  // Export dialog
  const [exportPassword, setExportPassword] = useState('');
  const [captchaChecked, setCaptchaChecked] = useState(false);
  
  // Load groups from localStorage
  useEffect(() => {
    const loadGroups = () => {
      const stored = localStorage.getItem('walletGroups');
      if (stored) {
        const parsed = JSON.parse(stored);
        setGroups(parsed);
        if (!parsed[activeGroup]) {
          // Create default group if it doesn't exist
          const defaultGroup: WalletGroup = {
            name: 'default',
            wallets: [],
            createdAt: new Date().toISOString()
          };
          setGroups({ ...parsed, default: defaultGroup });
        }
      } else {
        // Initialize with default group
        const defaultGroup: WalletGroup = {
          name: 'default',
          wallets: [],
          createdAt: new Date().toISOString()
        };
        setGroups({ default: defaultGroup });
      }
    };
    loadGroups();
  }, []);
  
  // Update wallets when active group changes
  useEffect(() => {
    if (groups[activeGroup]) {
      setWallets(groups[activeGroup].wallets);
    }
  }, [activeGroup, groups]);
  
  // Save groups to localStorage
  useEffect(() => {
    if (Object.keys(groups).length > 0) {
      localStorage.setItem('walletGroups', JSON.stringify(groups));
    }
  }, [groups]);
  
  const createNewGroup = () => {
    if (!newGroupName || groups[newGroupName]) {
      return toast.error('Invalid or duplicate group name');
    }
    
    const newGroup: WalletGroup = {
      name: newGroupName,
      wallets: [],
      createdAt: new Date().toISOString()
    };
    
    setGroups({ ...groups, [newGroupName]: newGroup });
    setActiveGroup(newGroupName);
    setNewGroupName('');
    toast.success(`Group "${newGroupName}" created`);
  };
  
  const handleCreateWallet = async () => {
    if (!password || password.length < 8) {
      return toast.error('Password must be at least 8 characters');
    }
    
    if (wallets.length >= 20) {
      return toast.error('Maximum 20 wallets per group');
    }
    
    try {
      setLoading(true);
      const { publicKey, encryptedPrivateKey } = await createWallet(password, role);
      
      const newWallet: WalletData = {
        publicKey,
        encryptedPrivateKey,
        role,
        balance: 0,
        createdAt: new Date().toISOString()
      };
      
      const updatedWallets = [...wallets, newWallet];
      setWallets(updatedWallets);
      
      // Update group
      setGroups({
        ...groups,
        [activeGroup]: {
          ...groups[activeGroup],
          wallets: updatedWallets
        }
      });
      
      toast.success('Wallet created successfully');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };
  
  const updateWalletRole = (walletPubkey: string, newRole: WalletRole) => {
    const updatedWallets = wallets.map(w => 
      w.publicKey === walletPubkey ? { ...w, role: newRole } : w
    );
    
    setWallets(updatedWallets);
    setGroups({
      ...groups,
      [activeGroup]: {
        ...groups[activeGroup],
        wallets: updatedWallets
      }
    });
    
    toast.success('Role updated');
  };
  
  const removeWallet = (walletPubkey: string) => {
    const updatedWallets = wallets.filter(w => w.publicKey !== walletPubkey);
    
    setWallets(updatedWallets);
    setGroups({
      ...groups,
      [activeGroup]: {
        ...groups[activeGroup],
        wallets: updatedWallets
      }
    });
    
    toast.success('Wallet removed');
  };
  
  const refreshBalances = async () => {
    setRefreshing(true);
    try {
      const balances = await getWalletBalances(
        wallets.map(w => w.publicKey),
        connection
      );
      
      const updatedWallets = wallets.map(w => ({
        ...w,
        balance: balances[w.publicKey] || 0
      }));
      
      setWallets(updatedWallets);
      setGroups({
        ...groups,
        [activeGroup]: {
          ...groups[activeGroup],
          wallets: updatedWallets
        }
      });
      
      toast.success('Balances updated');
    } catch (error) {
      toast.error('Failed to refresh balances');
    } finally {
      setRefreshing(false);
    }
  };
  
  const handleFundGroup = async () => {
    if (!connectedWallet) {
      return toast.error('Connect master wallet first');
    }
    
    const eligibleWallets = wallets.filter(w => w.role !== 'master');
    if (eligibleWallets.length === 0) {
      return toast.error('No eligible wallets to fund');
    }
    
    setLoading(true);
    try {
      // For production, you would decrypt the master wallet's keypair
      // Here we'll use a placeholder
      const masterKeypair = Keypair.generate(); // Replace with actual master wallet
      
      const signatures = await fundWalletGroup(
        masterKeypair,
        eligibleWallets,
        parseFloat(totalFunding),
        parseFloat(minSol),
        parseFloat(maxSol),
        connection
      );
      
      toast.success(`Funded ${eligibleWallets.length} wallets in ${signatures.length} transactions`);
      
      // Refresh balances after funding
      await refreshBalances();
    } catch (error) {
      toast.error(`Funding failed: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleExportKey = async (wallet: WalletData) => {
    if (!captchaChecked) {
      return toast.error('Please complete the security check');
    }
    
    if (!exportPassword) {
      return toast.error('Enter password to decrypt key');
    }
    
    try {
      // Decrypt the private key (simplified for demo)
      const decrypted = wallet.encryptedPrivateKey; // In production, actually decrypt
      
      // Create download
      const blob = new Blob([JSON.stringify({
        publicKey: wallet.publicKey,
        privateKey: decrypted,
        role: wallet.role
      }, null, 2)], { type: 'application/json' });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wallet-${wallet.publicKey.slice(0, 8)}.json`;
      a.click();
      
      toast.success('Wallet exported');
      setExportPassword('');
      setCaptchaChecked(false);
    } catch (error) {
      toast.error('Failed to export wallet');
    }
  };
  
  const exportGroup = () => {
    const groupData = groups[activeGroup];
    if (!groupData) return;
    
    const blob = new Blob([JSON.stringify(groupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallet-group-${activeGroup}.json`;
    a.click();
    
    toast.success('Group exported');
  };
  
  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied');
  };
  
  const getRoleBadgeColor = (role: WalletRole) => {
    switch (role) {
      case 'master': return 'bg-purple-500';
      case 'sniper': return 'bg-red-500';
      case 'dev': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="bg-black/40 backdrop-blur-xl border-aqua/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Wallet className="w-6 h-6" />
              Wallet Manager
            </span>
            <div className="flex items-center gap-2">
              <Select value={activeGroup} onValueChange={setActiveGroup}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(groups).map(groupName => (
                    <SelectItem key={groupName} value={groupName}>
                      {groupName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={exportGroup}>
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Create New Group */}
          <div className="flex gap-2">
            <Input
              placeholder="New group name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="flex-1"
            />
            <Button onClick={createNewGroup} disabled={!newGroupName}>
              <Users className="w-4 h-4 mr-1" />
              Create Group
            </Button>
          </div>
          
          {/* Create Wallet */}
          <div className="grid grid-cols-3 gap-2">
            <Input
              type="password"
              placeholder="Wallet password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Select value={role} onValueChange={(v) => setRole(v as WalletRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="sniper">Sniper</SelectItem>
                <SelectItem value="dev">Dev</SelectItem>
                <SelectItem value="master">Master</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleCreateWallet} disabled={loading}>
              Create Wallet
            </Button>
          </div>
          
          {/* Funding Controls */}
          <div className="p-4 bg-black/30 rounded-lg space-y-2">
            <h4 className="font-semibold text-aqua">Fund Group</h4>
            <div className="grid grid-cols-4 gap-2">
              <Input
                type="number"
                placeholder="Total SOL"
                value={totalFunding}
                onChange={(e) => setTotalFunding(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Min per wallet"
                value={minSol}
                onChange={(e) => setMinSol(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Max per wallet"
                value={maxSol}
                onChange={(e) => setMaxSol(e.target.value)}
              />
              <Button onClick={handleFundGroup} disabled={loading || !connectedWallet}>
                Fund Wallets
              </Button>
            </div>
          </div>
          
          {/* Wallet List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Wallets ({wallets.length}/20)</h4>
              <Button size="sm" variant="ghost" onClick={refreshBalances} disabled={refreshing}>
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            
            {loading || refreshing ? (
              <Skeleton className="h-32 w-full" />
            ) : wallets.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No wallets in this group</p>
            ) : (
              <div className="space-y-2">
                {wallets.map((wallet) => (
                  <Card key={wallet.publicKey} className="bg-black/20 border-aqua/10">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">
                              {wallet.publicKey.slice(0, 8)}...{wallet.publicKey.slice(-8)}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyAddress(wallet.publicKey)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Badge className={getRoleBadgeColor(wallet.role)}>
                              {wallet.role}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400">
                            Balance: {wallet.balance.toFixed(4)} SOL
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Select
                            value={wallet.role}
                            onValueChange={(newRole) => updateWalletRole(wallet.publicKey, newRole as WalletRole)}
                          >
                            <SelectTrigger className="w-24 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="sniper">Sniper</SelectItem>
                              <SelectItem value="dev">Dev</SelectItem>
                              <SelectItem value="master">Master</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <Key className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Export Private Key</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Input
                                  type="password"
                                  placeholder="Enter password"
                                  value={exportPassword}
                                  onChange={(e) => setExportPassword(e.target.value)}
                                />
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={captchaChecked}
                                    onCheckedChange={(checked) => setCaptchaChecked(!!checked)}
                                  />
                                  <label className="text-sm">
                                    I understand the security risks
                                  </label>
                                </div>
                                <Button
                                  onClick={() => handleExportKey(wallet)}
                                  disabled={!exportPassword || !captchaChecked}
                                  className="w-full"
                                >
                                  Export Key
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeWallet(wallet.publicKey)}
                            className="text-red-500 hover:text-red-400"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
} 