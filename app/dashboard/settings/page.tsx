'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card';
import { Input } from '@/components/UI/input';
import { Button } from '@/components/UI/button';
import { Label } from '@/components/UI/label';
import { Switch } from '@/components/UI/switch';
import { Badge } from '@/components/UI/badge';
import { Skeleton } from '@/components/UI/skeleton';
import { Settings, Key, Globe, Shield, Database, Save, Check, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface ApiKeys {
  heliusRpc?: string;
  birdeyeApiKey?: string;
  pumpfunApiKey?: string;
  letsbonkApiKey?: string;
  moonshotApiKey?: string;
}

interface Preferences {
  defaultSlippage: number;
  defaultPriorityFee: number;
  autoRefreshInterval: number;
  darkMode: boolean;
  soundNotifications: boolean;
}

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});
  const [preferences, setPreferences] = useState<Preferences>({
    defaultSlippage: 5,
    defaultPriorityFee: 0.00001,
    autoRefreshInterval: 30,
    darkMode: true,
    soundNotifications: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKeys, setShowKeys] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const loadSettings = () => {
      try {
        const storedKeys = localStorage.getItem('apiKeys');
        const storedPrefs = localStorage.getItem('preferences');
        
        if (storedKeys) {
          setApiKeys(JSON.parse(storedKeys));
        }
        
        if (storedPrefs) {
          setPreferences(JSON.parse(storedPrefs));
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  const handleSaveApiKeys = async () => {
    setSaving(true);
    try {
      // Validate API keys
      const validKeys: ApiKeys = {};
      
      if (apiKeys.heliusRpc) {
        validKeys.heliusRpc = apiKeys.heliusRpc;
      }
      
      if (apiKeys.birdeyeApiKey) {
        validKeys.birdeyeApiKey = apiKeys.birdeyeApiKey;
      }
      
      if (apiKeys.pumpfunApiKey) {
        validKeys.pumpfunApiKey = apiKeys.pumpfunApiKey;
      }
      
      if (apiKeys.letsbonkApiKey) {
        validKeys.letsbonkApiKey = apiKeys.letsbonkApiKey;
      }
      
      if (apiKeys.moonshotApiKey) {
        validKeys.moonshotApiKey = apiKeys.moonshotApiKey;
      }
      
      // Save to localStorage
      localStorage.setItem('apiKeys', JSON.stringify(validKeys));
      
      // Update runtime environment
      if (validKeys.heliusRpc) {
        (window as any).NEXT_PUBLIC_HELIUS_RPC = validKeys.heliusRpc;
      }
      
      toast.success('API keys saved successfully');
    } catch (error) {
      toast.error('Failed to save API keys');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      localStorage.setItem('preferences', JSON.stringify(preferences));
      toast.success('Preferences saved successfully');
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setPreferences({
      defaultSlippage: 5,
      defaultPriorityFee: 0.00001,
      autoRefreshInterval: 30,
      darkMode: true,
      soundNotifications: true
    });
    toast.success('Reset to default settings');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold flex items-center gap-3 mb-6">
          <Settings className="w-8 h-8 text-aqua" />
          Settings
        </h1>

        {/* API Keys Section */}
        <Card className="bg-black/40 backdrop-blur-xl border-aqua/20 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                API Keys
              </span>
              <div className="flex items-center gap-2">
                <Switch
                  checked={showKeys}
                  onCheckedChange={setShowKeys}
                />
                <span className="text-sm text-gray-400">
                  {showKeys ? 'Hide' : 'Show'} Keys
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Helius RPC Endpoint</Label>
              <Input
                type={showKeys ? 'text' : 'password'}
                value={apiKeys.heliusRpc || ''}
                onChange={(e) => setApiKeys({ ...apiKeys, heliusRpc: e.target.value })}
                placeholder="https://mainnet.helius-rpc.com/?api-key=..."
                className="bg-black/50 border-aqua/30 font-mono text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                Required for RPC connections. Get one at helius.xyz
              </p>
            </div>

            <div>
              <Label>Birdeye API Key</Label>
              <Input
                type={showKeys ? 'text' : 'password'}
                value={apiKeys.birdeyeApiKey || ''}
                onChange={(e) => setApiKeys({ ...apiKeys, birdeyeApiKey: e.target.value })}
                placeholder="Your Birdeye API key"
                className="bg-black/50 border-aqua/30 font-mono text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                Required for token prices and market data
              </p>
            </div>

            <div>
              <Label>Pump.fun API Key</Label>
              <Input
                type={showKeys ? 'text' : 'password'}
                value={apiKeys.pumpfunApiKey || ''}
                onChange={(e) => setApiKeys({ ...apiKeys, pumpfunApiKey: e.target.value })}
                placeholder="Your Pump.fun API key"
                className="bg-black/50 border-aqua/30 font-mono text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                Optional - For launching tokens on Pump.fun
              </p>
            </div>

            <div>
              <Label>LetsBonk API Key</Label>
              <Input
                type={showKeys ? 'text' : 'password'}
                value={apiKeys.letsbonkApiKey || ''}
                onChange={(e) => setApiKeys({ ...apiKeys, letsbonkApiKey: e.target.value })}
                placeholder="Your LetsBonk API key"
                className="bg-black/50 border-aqua/30 font-mono text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                Optional - For launching tokens on LetsBonk
              </p>
            </div>

            <div>
              <Label>Moonshot API Key</Label>
              <Input
                type={showKeys ? 'text' : 'password'}
                value={apiKeys.moonshotApiKey || ''}
                onChange={(e) => setApiKeys({ ...apiKeys, moonshotApiKey: e.target.value })}
                placeholder="Your Moonshot API key"
                className="bg-black/50 border-aqua/30 font-mono text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                Optional - For launching tokens on Moonshot
              </p>
            </div>

            <Button 
              onClick={handleSaveApiKeys} 
              disabled={saving}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              {saving ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save API Keys
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Preferences Section */}
        <Card className="bg-black/40 backdrop-blur-xl border-aqua/20 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Trading Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Default Slippage (%)</Label>
              <Input
                type="number"
                value={preferences.defaultSlippage}
                onChange={(e) => setPreferences({ ...preferences, defaultSlippage: parseFloat(e.target.value) })}
                step="0.5"
                min="0.1"
                max="50"
                className="bg-black/50 border-aqua/30"
              />
            </div>

            <div>
              <Label>Default Priority Fee (SOL)</Label>
              <Input
                type="number"
                value={preferences.defaultPriorityFee}
                onChange={(e) => setPreferences({ ...preferences, defaultPriorityFee: parseFloat(e.target.value) })}
                step="0.00001"
                min="0"
                max="0.1"
                className="bg-black/50 border-aqua/30"
              />
            </div>

            <div>
              <Label>Auto Refresh Interval (seconds)</Label>
              <Input
                type="number"
                value={preferences.autoRefreshInterval}
                onChange={(e) => setPreferences({ ...preferences, autoRefreshInterval: parseInt(e.target.value) })}
                step="5"
                min="10"
                max="300"
                className="bg-black/50 border-aqua/30"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Sound Notifications</Label>
                <p className="text-xs text-gray-400">Play sounds for important events</p>
              </div>
              <Switch
                checked={preferences.soundNotifications}
                onCheckedChange={(checked) => setPreferences({ ...preferences, soundNotifications: checked })}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleSavePreferences} 
                disabled={saving}
                className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
              >
                {saving ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Preferences
                  </>
                )}
              </Button>
              
              <Button 
                onClick={resetToDefaults} 
                variant="outline"
              >
                Reset to Defaults
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card className="bg-black/40 backdrop-blur-xl border-aqua/20 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-500">Important Security Notes</p>
                  <ul className="text-sm text-gray-300 mt-2 space-y-1">
                    <li>• API keys are stored locally in your browser</li>
                    <li>• Never share your API keys with anyone</li>
                    <li>• Private keys are encrypted with AES-256-GCM</li>
                    <li>• Always use strong passwords for wallet encryption</li>
                    <li>• Export wallets only when necessary</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Section */}
        <Card className="bg-black/40 backdrop-blur-xl border-aqua/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">SQLite Database</p>
                <p className="text-sm text-gray-400">Located at: ./data/analytics.db</p>
              </div>
              <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                <Check className="w-3 h-3 mr-1" />
                Active
              </Badge>
            </div>
            
            <p className="text-sm text-gray-400">
              The database stores execution logs, token launches, P/L records, and other analytics data.
              Run <code className="bg-black/50 px-2 py-1 rounded">npm run db:init</code> to initialize.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
} 