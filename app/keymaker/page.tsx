'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';
import { Switch } from '@/components/UI/switch';
import { Slider } from '@/components/UI/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/UI/Tabs';
import { Badge } from '@/components/UI/badge';
import { toast } from 'sonner';

interface VolumeTask {
  id: number;
  name: string;
  mint: string;
  wallet_group: string;
  buy_amount: number;
  sell_amount: number;
  buy_sell_ratio: number;
  delay_min: number;
  delay_max: number;
  is_active: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export default function KeymakerPage() {
  const [volumeTasks, setVolumeTasks] = useState<VolumeTask[]>([]);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newTask, setNewTask] = useState({
    name: '',
    mint: '',
    walletGroup: '',
    buyAmount: 0.1,
    sellAmount: 0.05,
    buySellRatio: 2,
    delayMin: 30,
    delayMax: 120,
  });

  // Fetch volume tasks on component mount
  useEffect(() => {
    fetchVolumeTasks();
  }, []);

  const fetchVolumeTasks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/keymaker/volume-tasks');
      const result = await response.json();
      
      if (result.success) {
        setVolumeTasks(result.tasks);
      } else {
        toast.error('Failed to fetch volume tasks');
      }
    } catch (error) {
      console.error('Error fetching volume tasks:', error);
      toast.error('Failed to fetch volume tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.name || !newTask.mint || !newTask.walletGroup) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCreatingTask(true);
    try {
      const response = await fetch('/api/keymaker/volume-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTask.name,
          mint: newTask.mint,
          walletGroup: newTask.walletGroup,
          buyAmount: newTask.buyAmount,
          sellAmount: newTask.sellAmount,
          buySellRatio: newTask.buySellRatio,
          delayMin: newTask.delayMin,
          delayMax: newTask.delayMax,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Volume task created successfully!');
        fetchVolumeTasks(); // Refresh the list
        
        // Reset form
        setNewTask({
          name: '',
          mint: '',
          walletGroup: '',
          buyAmount: 0.1,
          sellAmount: 0.05,
          buySellRatio: 2,
          delayMin: 30,
          delayMax: 120,
        });
      } else {
        throw new Error(result.error || 'Failed to create volume task');
      }
    } catch (error) {
      console.error('Error creating volume task:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create volume task');
    } finally {
      setIsCreatingTask(false);
    }
  };

  const toggleTask = async (taskId: number) => {
    try {
      const task = volumeTasks.find(t => t.id === taskId);
      if (!task) return;

      const endpoint = task.is_active ? 'stop' : 'start';
      const response = await fetch(`/api/keymaker/volume-tasks/${taskId}/${endpoint}`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Task ${task.is_active ? 'stopped' : 'started'} successfully`);
        fetchVolumeTasks(); // Refresh the list
      } else {
        throw new Error(result.error || 'Failed to toggle task');
      }
    } catch (error) {
      console.error('Error toggling task:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to toggle task');
    }
  };

  const deleteTask = async (taskId: number) => {
    if (!confirm('Are you sure you want to delete this volume task?')) {
      return;
    }

    try {
      const response = await fetch(`/api/keymaker/volume-tasks/${taskId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Task deleted successfully');
        fetchVolumeTasks(); // Refresh the list
      } else {
        throw new Error(result.error || 'Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete task');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100">Keymaker</h1>
          <p className="text-zinc-400 mt-2">Automated market making and volume generation</p>
        </div>
        <Badge variant="outline" className="border-blue-500 text-blue-400">
          {volumeTasks.filter(t => t.is_active).length} Active Tasks
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create New Task */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Create Volume Task</CardTitle>
            <CardDescription className="text-zinc-400">
              Set up automated buy/sell volume for your tokens
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleCreateTask(); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="taskName" className="text-zinc-300">Task Name</Label>
                  <Input
                    id="taskName"
                    value={newTask.name}
                    onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                    placeholder="My Volume Bot"
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="mint" className="text-zinc-300">Token Mint</Label>
                  <Input
                    id="mint"
                    value={newTask.mint}
                    onChange={(e) => setNewTask({ ...newTask, mint: e.target.value })}
                    placeholder="Token address"
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="walletGroup" className="text-zinc-300">Wallet Group</Label>
                <Input
                  id="walletGroup"
                  value={newTask.walletGroup}
                  onChange={(e) => setNewTask({ ...newTask, walletGroup: e.target.value })}
                  placeholder="Select wallet group"
                  className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="buyAmount" className="text-zinc-300">Buy Amount (SOL)</Label>
                  <Input
                    id="buyAmount"
                    type="number"
                    step="0.01"
                    value={newTask.buyAmount}
                    onChange={(e) => setNewTask({ ...newTask, buyAmount: parseFloat(e.target.value) || 0 })}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
                <div>
                  <Label htmlFor="sellAmount" className="text-zinc-300">Sell Amount (SOL)</Label>
                  <Input
                    id="sellAmount"
                    type="number"
                    step="0.01"
                    value={newTask.sellAmount}
                    onChange={(e) => setNewTask({ ...newTask, sellAmount: parseFloat(e.target.value) || 0 })}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <Label className="text-zinc-300">Buy/Sell Ratio: {newTask.buySellRatio}:1</Label>
                <Slider
                  value={[newTask.buySellRatio]}
                  onValueChange={(value) => setNewTask({ ...newTask, buySellRatio: value[0] })}
                  min={1}
                  max={5}
                  step={0.5}
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="delayMin" className="text-zinc-300">Min Delay (seconds)</Label>
                  <Input
                    id="delayMin"
                    type="number"
                    value={newTask.delayMin}
                    onChange={(e) => setNewTask({ ...newTask, delayMin: parseInt(e.target.value) || 30 })}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
                <div>
                  <Label htmlFor="delayMax" className="text-zinc-300">Max Delay (seconds)</Label>
                  <Input
                    id="delayMax"
                    type="number"
                    value={newTask.delayMax}
                    onChange={(e) => setNewTask({ ...newTask, delayMax: parseInt(e.target.value) || 120 })}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isCreatingTask}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isCreatingTask ? 'Creating Task...' : 'Create Volume Task'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Active Tasks */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Volume Tasks</CardTitle>
            <CardDescription className="text-zinc-400">
              Manage your automated volume generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-8 text-zinc-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-sm mt-2">Loading tasks...</p>
                </div>
              ) : volumeTasks.length === 0 ? (
                <div className="text-center py-8 text-zinc-400">
                  <p>No volume tasks created yet.</p>
                  <p className="text-sm">Create your first task to get started!</p>
                </div>
              ) : (
                volumeTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-zinc-100">{task.name}</h3>
                        <Badge 
                          variant={task.is_active ? "default" : "outline"}
                          className={task.is_active ? "bg-green-600" : "border-zinc-600 text-zinc-400"}
                        >
                          {task.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-zinc-400">
                        {task.buy_amount} SOL buy / {task.sell_amount} SOL sell
                      </p>
                      <p className="text-xs text-zinc-500">
                        Delay: {task.delay_min}s - {task.delay_max}s
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={task.is_active}
                        onCheckedChange={() => toggleTask(task.id)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteTask(task.id)}
                        className="border-red-500 text-red-400 hover:bg-red-500/10"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-zinc-100">
              {volumeTasks.length}
            </div>
            <div className="text-sm text-zinc-400">Total Tasks</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">
              {volumeTasks.filter(t => t.is_active).length}
            </div>
            <div className="text-sm text-zinc-400">Active Tasks</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">
              {volumeTasks.reduce((sum, task) => sum + task.buy_amount, 0).toFixed(2)}
            </div>
            <div className="text-sm text-zinc-400">Total Buy Power (SOL)</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-400">
              {volumeTasks.reduce((sum, task) => sum + task.sell_amount, 0).toFixed(2)}
            </div>
            <div className="text-sm text-zinc-400">Total Sell Power (SOL)</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
