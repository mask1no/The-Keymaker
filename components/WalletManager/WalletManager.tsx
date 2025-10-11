'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';
import { Badge } from '@/components/UI/badge';
import { Plus, Wallet, Settings, Trash2 } from 'lucide-react';
import * as bs58 from 'bs58';
import { apiFetch } from '@/lib/apiClient';

interface Wallet {
  address: string;
  name: string;
  groupId?: string;
}

interface Group {
  id: string;
  name: string;
}

export default function WalletManager() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState('');
  const [newWalletName, setNewWalletName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [groupsRes, walletsRes] = await Promise.all([
        fetch('/api/groups'),
        fetch('/api/wallets'),
      ]);

      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        setGroups(groupsData.groups || []);
      }

      if (walletsRes.ok) {
        const walletsData = await walletsRes.json();
        setWallets(walletsData.wallets || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) return;

    try {
      const res = await apiFetch('/api/groups', {
        method: 'POST',
        body: JSON.stringify({ name: newGroupName.trim() }),
      });

      if (res.ok) {
        setNewGroupName('');
        loadData();
      }
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  };

  const createWallet = async () => {
    if (!newWalletName.trim() || !selectedGroup) return;

    try {
      // Generate a mock keypair for demo purposes
      const mockKeypair = 'mock_encrypted_keypair_data';

      const res = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newWalletName.trim(),
          encryptedKeypair: mockKeypair,
        }),
      });

      if (res.ok) {
        setNewWalletName('');
        loadData();
      }
    } catch (error) {
      console.error('Failed to create wallet:', error);
    }
  };

  async function importBulk(input: string) {
    const secrets = input.split(',').map((s) => s.trim());
    for (const secret of secrets) {
      try {
        bs58.decode(secret); // Validate
        // Call import API with secret
        await apiFetch('/api/groups/import-wallet', {
          method: 'POST',
          body: JSON.stringify({ groupId: 'your-group', secret }),
        });
      } catch {
        alert(`Invalid key: ${secret}`);
      }
    }
  }

  if (loading) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-6">
          <div className="text-center text-zinc-400">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Group */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Create Wallet Group
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Organize your wallets into groups for easier management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Group name..."
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="bg-zinc-800 border-zinc-700"
            />
            <Button onClick={createGroup} disabled={!newGroupName.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Create
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <Card key={group.id} className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100 text-lg">{group.name}</CardTitle>
              <CardDescription className="text-zinc-400">
                {wallets.filter((w) => w.groupId === group.id).length} wallets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {wallets
                  .filter((w) => w.groupId === group.id)
                  .map((wallet) => (
                    <div
                      key={wallet.address}
                      className="flex items-center justify-between p-2 bg-zinc-800/50 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-zinc-400" />
                        <span className="text-sm text-zinc-300">{wallet.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {wallet.address.slice(0, 4)}...{wallet.address.slice(-4)}
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Wallet */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Wallet
          </CardTitle>
          <CardDescription className="text-zinc-400">Add a new wallet to a group</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="group-select" className="text-zinc-300">
                Group
              </Label>
              <select
                id="group-select"
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100"
              >
                <option value="">Select a group...</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Wallet name..."
                value={newWalletName}
                onChange={(e) => setNewWalletName(e.target.value)}
                className="bg-zinc-800 border-zinc-700"
              />
              <Button onClick={createWallet} disabled={!newWalletName.trim() || !selectedGroup}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
            <div>
              <Label htmlFor="bulk-import" className="text-zinc-300">
                Bulk Import (CSV)
              </Label>
              <textarea
                id="bulk-import"
                onChange={(e) => importBulk(e.target.value)}
                placeholder="Paste CSV keys"
                className="w-full mt-1 p-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
