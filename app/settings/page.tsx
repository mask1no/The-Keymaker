'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';
import { Switch } from '@/components/UI/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/UI/Tabs';
import { Badge } from '@/components/UI/badge';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

interface Settings {
  // RPC & Network
  rpcUrl: string;
  jitoEnabled: boolean;
  jitoRegion: string;
  jitoPriority: string;
  tipLamports: number;

  // Trading
  slippageTolerance: number;
  maxGasPrice: number;
  chunkSize: number;
  concurrency: number;

  // Hotkeys
  hotkeys: {
    devSell: string;
    sellAll: string;
    emergencyStop: string;
    toggleJito: string;
  };

  // UI
  theme: string;
  notifications: boolean;
  soundEffects: boolean;

  // Advanced
  dryRun: boolean;
  cluster: string;
  jitterMin: number;
  jitterMax: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    jitoEnabled: true,
    jitoRegion: 'ffm',
    jitoPriority: 'med',
    tipLamports: 5000,
    slippageTolerance: 1.0,
    maxGasPrice: 0.01,
    chunkSize: 5,
    concurrency: 4,
    hotkeys: {
      devSell: 'Ctrl+D',
      sellAll: 'Ctrl+S',
      emergencyStop: 'Ctrl+E',
      toggleJito: 'Ctrl+J',
    },
    theme: 'dark',
    notifications: true,
    soundEffects: false,
    dryRun: false,
    cluster: 'mainnet-beta',
    jitterMin: 50,
    jitterMax: 150,
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load settings from localStorage or API
    const savedSettings = localStorage.getItem('keymaker-settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('keymaker-settings', JSON.stringify(settings));

      // TODO: Save to backend API
      // await saveSettings(settings);

      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      setSettings({
        rpcUrl: 'https://api.mainnet-beta.solana.com',
        jitoEnabled: true,
        jitoRegion: 'ffm',
        jitoPriority: 'med',
        tipLamports: 5000,
        slippageTolerance: 1.0,
        maxGasPrice: 0.01,
        chunkSize: 5,
        concurrency: 4,
        hotkeys: {
          devSell: 'Ctrl+D',
          sellAll: 'Ctrl+S',
          emergencyStop: 'Ctrl+E',
          toggleJito: 'Ctrl+J',
        },
        theme: 'dark',
        notifications: true,
        soundEffects: false,
        dryRun: false,
        cluster: 'mainnet-beta',
        jitterMin: 50,
        jitterMax: 150,
      });
      toast.success('Settings reset to default');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100">Settings</h1>
          <p className="text-zinc-400 mt-2">Configure your trading environment and preferences</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleReset}
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="network" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-zinc-800">
          <TabsTrigger value="network" className="text-zinc-300">
            Network
          </TabsTrigger>
          <TabsTrigger value="trading" className="text-zinc-300">
            Trading
          </TabsTrigger>
          <TabsTrigger value="hotkeys" className="text-zinc-300">
            Hotkeys
          </TabsTrigger>
          <TabsTrigger value="ui" className="text-zinc-300">
            Interface
          </TabsTrigger>
          <TabsTrigger value="advanced" className="text-zinc-300">
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="network" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* RPC Configuration */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-zinc-100">RPC Configuration</CardTitle>
                <CardDescription className="text-zinc-400">
                  Configure your Solana RPC connection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="rpcUrl" className="text-zinc-300">
                    RPC URL
                  </Label>
                  <Input
                    id="rpcUrl"
                    value={settings.rpcUrl}
                    onChange={(e) => setSettings({ ...settings, rpcUrl: e.target.value })}
                    placeholder="https://api.mainnet-beta.solana.com"
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
                <div>
                  <Label htmlFor="cluster" className="text-zinc-300">
                    Cluster
                  </Label>
                  <select
                    id="cluster"
                    value={settings.cluster}
                    onChange={(e) => setSettings({ ...settings, cluster: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md"
                  >
                    <option value="mainnet-beta">Mainnet Beta</option>
                    <option value="devnet">Devnet</option>
                    <option value="testnet">Testnet</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-zinc-300">Dry Run Mode</Label>
                    <p className="text-sm text-zinc-400">Simulate transactions without executing</p>
                  </div>
                  <Switch
                    checked={settings.dryRun}
                    onCheckedChange={(checked) => setSettings({ ...settings, dryRun: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Jito Configuration */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-zinc-100 flex items-center gap-2">
                  Jito Configuration
                  <Badge variant="outline" className="border-blue-500 text-blue-400">
                    Fast Transactions
                  </Badge>
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Enable Jito for faster transaction execution
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-zinc-300">Enable Jito</Label>
                    <p className="text-sm text-zinc-400">Use Jito bundles for faster execution</p>
                  </div>
                  <Switch
                    checked={settings.jitoEnabled}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, jitoEnabled: checked })
                    }
                  />
                </div>

                {settings.jitoEnabled && (
                  <>
                    <div>
                      <Label htmlFor="jitoRegion" className="text-zinc-300">
                        Jito Region
                      </Label>
                      <select
                        id="jitoRegion"
                        value={settings.jitoRegion}
                        onChange={(e) => setSettings({ ...settings, jitoRegion: e.target.value })}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md"
                      >
                        <option value="ffm">Frankfurt (ffm)</option>
                        <option value="ams">Amsterdam (ams)</option>
                        <option value="ny">New York (ny)</option>
                        <option value="tokyo">Tokyo (tokyo)</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="jitoPriority" className="text-zinc-300">
                        Priority Level
                      </Label>
                      <select
                        id="jitoPriority"
                        value={settings.jitoPriority}
                        onChange={(e) => setSettings({ ...settings, jitoPriority: e.target.value })}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md"
                      >
                        <option value="low">Low</option>
                        <option value="med">Medium</option>
                        <option value="high">High</option>
                        <option value="vhigh">Very High</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="tipLamports" className="text-zinc-300">
                        Tip Amount (Lamports)
                      </Label>
                      <Input
                        id="tipLamports"
                        type="number"
                        value={settings.tipLamports}
                        onChange={(e) =>
                          setSettings({ ...settings, tipLamports: parseInt(e.target.value) || 0 })
                        }
                        className="bg-zinc-800 border-zinc-700 text-zinc-100"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trading" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trading Parameters */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-zinc-100">Trading Parameters</CardTitle>
                <CardDescription className="text-zinc-400">
                  Configure your trading behavior
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="slippageTolerance" className="text-zinc-300">
                    Slippage Tolerance (%)
                  </Label>
                  <Input
                    id="slippageTolerance"
                    type="number"
                    step="0.1"
                    value={settings.slippageTolerance}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        slippageTolerance: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
                <div>
                  <Label htmlFor="maxGasPrice" className="text-zinc-300">
                    Max Gas Price (SOL)
                  </Label>
                  <Input
                    id="maxGasPrice"
                    type="number"
                    step="0.001"
                    value={settings.maxGasPrice}
                    onChange={(e) =>
                      setSettings({ ...settings, maxGasPrice: parseFloat(e.target.value) || 0 })
                    }
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
                <div>
                  <Label htmlFor="chunkSize" className="text-zinc-300">
                    Chunk Size (Jito)
                  </Label>
                  <Input
                    id="chunkSize"
                    type="number"
                    value={settings.chunkSize}
                    onChange={(e) =>
                      setSettings({ ...settings, chunkSize: parseInt(e.target.value) || 0 })
                    }
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
                <div>
                  <Label htmlFor="concurrency" className="text-zinc-300">
                    Concurrency (RPC)
                  </Label>
                  <Input
                    id="concurrency"
                    type="number"
                    value={settings.concurrency}
                    onChange={(e) =>
                      setSettings({ ...settings, concurrency: parseInt(e.target.value) || 0 })
                    }
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Jitter Settings */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-zinc-100">Timing & Jitter</CardTitle>
                <CardDescription className="text-zinc-400">
                  Configure transaction timing and randomization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="jitterMin" className="text-zinc-300">
                    Min Jitter (ms)
                  </Label>
                  <Input
                    id="jitterMin"
                    type="number"
                    value={settings.jitterMin}
                    onChange={(e) =>
                      setSettings({ ...settings, jitterMin: parseInt(e.target.value) || 0 })
                    }
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
                <div>
                  <Label htmlFor="jitterMax" className="text-zinc-300">
                    Max Jitter (ms)
                  </Label>
                  <Input
                    id="jitterMax"
                    type="number"
                    value={settings.jitterMax}
                    onChange={(e) =>
                      setSettings({ ...settings, jitterMax: parseInt(e.target.value) || 0 })
                    }
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
                <div className="p-3 bg-zinc-800/50 rounded-lg">
                  <p className="text-sm text-zinc-400">
                    Jitter adds random delays between transactions to avoid detection and reduce MEV
                    risk.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="hotkeys" className="space-y-4 mt-6">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100">Keyboard Shortcuts</CardTitle>
              <CardDescription className="text-zinc-400">
                Configure hotkeys for quick actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="devSell" className="text-zinc-300">
                    Dev Sell
                  </Label>
                  <Input
                    id="devSell"
                    value={settings.hotkeys.devSell}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        hotkeys: { ...settings.hotkeys, devSell: e.target.value },
                      })
                    }
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
                <div>
                  <Label htmlFor="sellAll" className="text-zinc-300">
                    Sell All
                  </Label>
                  <Input
                    id="sellAll"
                    value={settings.hotkeys.sellAll}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        hotkeys: { ...settings.hotkeys, sellAll: e.target.value },
                      })
                    }
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyStop" className="text-zinc-300">
                    Emergency Stop
                  </Label>
                  <Input
                    id="emergencyStop"
                    value={settings.hotkeys.emergencyStop}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        hotkeys: { ...settings.hotkeys, emergencyStop: e.target.value },
                      })
                    }
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
                <div>
                  <Label htmlFor="toggleJito" className="text-zinc-300">
                    Toggle Jito
                  </Label>
                  <Input
                    id="toggleJito"
                    value={settings.hotkeys.toggleJito}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        hotkeys: { ...settings.hotkeys, toggleJito: e.target.value },
                      })
                    }
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
              </div>
              <div className="p-3 bg-zinc-800/50 rounded-lg">
                <p className="text-sm text-zinc-400">
                  Hotkeys are global and work even when the app is not focused. Use Ctrl, Alt, or
                  Shift modifiers.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ui" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Interface Settings */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-zinc-100">Interface</CardTitle>
                <CardDescription className="text-zinc-400">
                  Customize your user experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="theme" className="text-zinc-300">
                    Theme
                  </Label>
                  <select
                    id="theme"
                    value={settings.theme}
                    onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md"
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="system">System</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-zinc-300">Notifications</Label>
                    <p className="text-sm text-zinc-400">Show desktop notifications</p>
                  </div>
                  <Switch
                    checked={settings.notifications}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, notifications: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-zinc-300">Sound Effects</Label>
                    <p className="text-sm text-zinc-400">Play sounds for actions</p>
                  </div>
                  <Switch
                    checked={settings.soundEffects}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, soundEffects: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Status Display */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-zinc-100">Current Status</CardTitle>
                <CardDescription className="text-zinc-400">
                  Your current configuration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-300">Execution Mode</span>
                    <Badge variant="outline" className="border-blue-500 text-blue-400">
                      {settings.jitoEnabled ? 'Jito' : 'RPC'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-300">Dry Run</span>
                    <Badge
                      variant="outline"
                      className={
                        settings.dryRun
                          ? 'border-yellow-500 text-yellow-400'
                          : 'border-green-500 text-green-400'
                      }
                    >
                      {settings.dryRun ? 'ON' : 'OFF'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-300">Cluster</span>
                    <Badge variant="outline" className="border-zinc-500 text-zinc-400">
                      {settings.cluster}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-300">Region</span>
                    <Badge variant="outline" className="border-zinc-500 text-zinc-400">
                      {settings.jitoRegion}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4 mt-6">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100">Advanced Settings</CardTitle>
              <CardDescription className="text-zinc-400">
                Advanced configuration options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-yellow-900/20 border border-yellow-800 rounded-lg">
                <h3 className="font-medium text-yellow-400 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Advanced Mode
                </h3>
                <p className="text-sm text-yellow-300">
                  These settings are for advanced users only. Incorrect configuration may cause
                  trading failures.
                </p>
              </div>

              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="chunkSize" className="text-zinc-300">
                      Chunk Size
                    </Label>
                    <Input
                      id="chunkSize"
                      type="number"
                      value={settings.chunkSize}
                      onChange={(e) =>
                        setSettings({ ...settings, chunkSize: parseInt(e.target.value) || 0 })
                      }
                      className="bg-zinc-800 border-zinc-700 text-zinc-100"
                    />
                    <p className="text-xs text-zinc-500 mt-1">
                      Number of transactions per Jito bundle
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="concurrency" className="text-zinc-300">
                      Concurrency
                    </Label>
                    <Input
                      id="concurrency"
                      type="number"
                      value={settings.concurrency}
                      onChange={(e) =>
                        setSettings({ ...settings, concurrency: parseInt(e.target.value) || 0 })
                      }
                      className="bg-zinc-800 border-zinc-700 text-zinc-100"
                    />
                    <p className="text-xs text-zinc-500 mt-1">Number of concurrent RPC requests</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
