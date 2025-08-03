'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/input';
import { Badge } from '@/components/UI/badge';
import { Label } from '@/components/UI/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/UI/dialog';
import { Checkbox } from '@/components/UI/checkbox';
import { Plus, Users, Wallet, Edit2, Trash2, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface WalletGroup {
  id: string;
  name: string;
  wallets: string[];
  color: string;
  description?: string;
}

interface WalletGroupsProps {
  wallets: Array<{ publicKey: string; role: string; balance?: number }>;
  groups: WalletGroup[];
  onGroupsChange: (groups: WalletGroup[]) => void;
}

const groupColors = [
  '#3B82F6', // blue
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
];

export function WalletGroups({ wallets, groups, onGroupsChange }: WalletGroupsProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<WalletGroup | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedWallets, setSelectedWallets] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState(groupColors[0]);

  const createGroup = () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    if (selectedWallets.length === 0) {
      toast.error('Please select at least one wallet');
      return;
    }

    const newGroup: WalletGroup = {
      id: Date.now().toString(),
      name: groupName,
      description: groupDescription,
      wallets: selectedWallets,
      color: selectedColor
    };

    onGroupsChange([...groups, newGroup]);
    toast.success(`Group "${groupName}" created`);
    resetDialog();
  };

  const updateGroup = () => {
    if (!editingGroup || !groupName.trim()) return;

    const updatedGroups = groups.map(g => 
      g.id === editingGroup.id 
        ? { ...g, name: groupName, description: groupDescription, wallets: selectedWallets, color: selectedColor }
        : g
    );

    onGroupsChange(updatedGroups);
    toast.success(`Group "${groupName}" updated`);
    resetDialog();
  };

  const deleteGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    if (confirm(`Delete group "${group.name}"?`)) {
      onGroupsChange(groups.filter(g => g.id !== groupId));
      toast.success(`Group "${group.name}" deleted`);
    }
  };

  const resetDialog = () => {
    setShowCreateDialog(false);
    setEditingGroup(null);
    setGroupName('');
    setGroupDescription('');
    setSelectedWallets([]);
    setSelectedColor(groupColors[0]);
  };

  const openEditDialog = (group: WalletGroup) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setGroupDescription(group.description || '');
    setSelectedWallets(group.wallets);
    setSelectedColor(group.color);
    setShowCreateDialog(true);
  };

  const toggleWalletSelection = (walletKey: string) => {
    setSelectedWallets(prev => 
      prev.includes(walletKey)
        ? prev.filter(w => w !== walletKey)
        : [...prev, walletKey]
    );
  };

  const selectAllWallets = () => {
    setSelectedWallets(wallets.map(w => w.publicKey));
  };

  const deselectAllWallets = () => {
    setSelectedWallets([]);
  };

  const getWalletGroups = (walletKey: string) => {
    return groups.filter(g => g.wallets.includes(walletKey));
  };

  return (
    <>
      <Card className="bg-black/40 backdrop-blur-xl border-aqua/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Wallet Groups
            </span>
            <Button onClick={() => setShowCreateDialog(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Create Group
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {groups.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No groups created yet</p>
              <p className="text-sm mt-2">Create groups to organize your wallets</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {groups.map((group) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <Card 
                      className="bg-black/60 border-gray-700 hover:border-gray-600 transition-colors"
                      style={{ borderLeftColor: group.color, borderLeftWidth: '4px' }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{group.name}</h3>
                            {group.description && (
                              <p className="text-sm text-gray-400 mt-1">{group.description}</p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(group)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteGroup(group.id)}
                              className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Wallet className="w-4 h-4" />
                            {group.wallets.length} wallets
                          </span>
                          <span className="flex items-center gap-1">
                            <Copy className="w-4 h-4" />
                            {group.wallets.reduce((sum, w) => {
                              const wallet = wallets.find(wal => wal.publicKey === w);
                              return sum + (wallet?.balance || 0);
                            }, 0).toFixed(4)} SOL
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Group Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? 'Edit Group' : 'Create Wallet Group'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Group Name</Label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g., Sniper Squad Alpha"
              />
            </div>
            
            <div>
              <Label>Description (optional)</Label>
              <Input
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="e.g., High-volume trading wallets"
              />
            </div>
            
            <div>
              <Label>Color</Label>
              <div className="flex gap-2 mt-2">
                {groupColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      selectedColor === color ? 'ring-2 ring-offset-2 ring-offset-black ring-white' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Select Wallets ({selectedWallets.length} selected)</Label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAllWallets}>
                    Select All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={deselectAllWallets}>
                    Deselect All
                  </Button>
                </div>
              </div>
              
              <div className="border border-gray-700 rounded-lg p-4 max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {wallets.map((wallet) => {
                    const existingGroups = getWalletGroups(wallet.publicKey);
                    return (
                      <div key={wallet.publicKey} className="flex items-center justify-between">
                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                          <Checkbox
                            checked={selectedWallets.includes(wallet.publicKey)}
                            onCheckedChange={() => toggleWalletSelection(wallet.publicKey)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm">
                                {wallet.publicKey.slice(0, 4)}...{wallet.publicKey.slice(-4)}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {wallet.role}
                              </Badge>
                            </div>
                            {existingGroups.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {existingGroups.map(g => (
                                  <Badge
                                    key={g.id}
                                    variant="outline"
                                    className="text-xs"
                                    style={{ borderColor: g.color, color: g.color }}
                                  >
                                    {g.name}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <span className="text-sm text-gray-400">
                            {(wallet.balance || 0).toFixed(4)} SOL
                          </span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={resetDialog}>
              Cancel
            </Button>
            <Button onClick={editingGroup ? updateGroup : createGroup}>
              {editingGroup ? 'Update Group' : 'Create Group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}