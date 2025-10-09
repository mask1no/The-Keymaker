'use client';

import { useState } from 'react';
import { Button } from '@/components/UI/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/UI/select';
import { Switch } from '@/components/UI/switch';

interface BundleSettingsProps {
  onSettingsChange: (settings: any) => void;
}

export function BundleSettings({ onSettingsChange }: BundleSettingsProps) {
  const [settings, setSettings] = useState({
    mode: 'JITO_BUNDLE',
    region: 'ffm',
    priority: 'med',
    tipLamports: 5000,
    chunkSize: 5,
    concurrency: 4,
    jitterMs: [50, 150],
    dryRun: true,
    cluster: 'mainnet-beta',
  });

  const updateSetting = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Bundle Settings</CardTitle>
        <CardDescription>Configure your bundle execution parameters</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Execution Mode</Label>
            <Select
              value={settings.mode}
              onValueChange={(value) => updateSetting('mode', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="JITO_BUNDLE">JITO Bundle</SelectItem>
                <SelectItem value="RPC_FANOUT">RPC Fanout</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Region</Label>
            <Select
              value={settings.region}
              onValueChange={(value) => updateSetting('region', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ffm">Frankfurt (ffm)</SelectItem>
                <SelectItem value="ams">Amsterdam (ams)</SelectItem>
                <SelectItem value="ny">New York (ny)</SelectItem>
                <SelectItem value="tokyo">Tokyo (tokyo)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Priority</Label>
            <Select
              value={settings.priority}
              onValueChange={(value) => updateSetting('priority', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="med">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="vhigh">Very High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Tip (Lamports)</Label>
            <Input
              type="number"
              value={settings.tipLamports}
              onChange={(e) => updateSetting('tipLamports', parseInt(e.target.value))}
              placeholder="5000"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Chunk Size</Label>
            <Input
              type="number"
              value={settings.chunkSize}
              onChange={(e) => updateSetting('chunkSize', parseInt(e.target.value))}
              placeholder="5"
              min="1"
              max="20"
            />
          </div>

          <div>
            <Label>Concurrency</Label>
            <Input
              type="number"
              value={settings.concurrency}
              onChange={(e) => updateSetting('concurrency', parseInt(e.target.value))}
              placeholder="4"
              min="1"
              max="10"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Jitter Min (ms)</Label>
            <Input
              type="number"
              value={settings.jitterMs[0]}
              onChange={(e) => updateSetting('jitterMs', [parseInt(e.target.value), settings.jitterMs[1]])}
              placeholder="50"
            />
          </div>

          <div>
            <Label>Jitter Max (ms)</Label>
            <Input
              type="number"
              value={settings.jitterMs[1]}
              onChange={(e) => updateSetting('jitterMs', [settings.jitterMs[0], parseInt(e.target.value)])}
              placeholder="150"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Cluster</Label>
            <Select
              value={settings.cluster}
              onValueChange={(value) => updateSetting('cluster', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mainnet-beta">Mainnet Beta</SelectItem>
                <SelectItem value="devnet">Devnet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={settings.dryRun}
              onCheckedChange={(checked) => updateSetting('dryRun', checked)}
            />
            <Label>Dry Run Mode</Label>
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button
            onClick={() => onSettingsChange(settings)}
            className="w-full"
          >
            Apply Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}