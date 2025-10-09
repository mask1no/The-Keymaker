'use client';

import { useState } from 'react';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/input';
import { Label } from '@/components/UI/label';
import { Textarea } from '@/components/UI/Textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/UI/Tabs';
import { toast } from 'sonner';
import { Upload, Key, FileText } from 'lucide-react';

interface WalletImportProps {
  onImport: (wallets: { name: string; privateKey: string }[]) => void;
  isLoading?: boolean;
}

export function WalletImport({ onImport, isLoading = false }: WalletImportProps) {
  const [activeTab, setActiveTab] = useState('privateKey');
  const [privateKeyInput, setPrivateKeyInput] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [walletName, setWalletName] = useState('');

  const handlePrivateKeyImport = () => {
    if (!privateKeyInput.trim()) {
      toast.error('Private key is required');
      return;
    }

    if (!walletName.trim()) {
      toast.error('Wallet name is required');
      return;
    }

    try {
      // Basic validation - check if it looks like a base58 private key
      if (privateKeyInput.length < 32) {
        toast.error('Invalid private key format');
        return;
      }

      onImport([{ name: walletName, privateKey: privateKeyInput.trim() }]);
      setPrivateKeyInput('');
      setWalletName('');
      toast.success('Wallet imported successfully');
    } catch (error) {
      toast.error('Failed to import wallet');
    }
  };

  const handleJsonImport = () => {
    if (!jsonInput.trim()) {
      toast.error('JSON data is required');
      return;
    }

    try {
      const jsonData = JSON.parse(jsonInput);

      // Handle different JSON formats
      let wallets: { name: string; privateKey: string }[] = [];

      if (Array.isArray(jsonData)) {
        // Array of wallet objects
        wallets = jsonData.map((wallet, index) => ({
          name: wallet.name || `Wallet ${index + 1}`,
          privateKey: wallet.privateKey || wallet.secretKey || wallet.key,
        }));
      } else if (jsonData.privateKey || jsonData.secretKey || jsonData.key) {
        // Single wallet object
        wallets = [
          {
            name: jsonData.name || 'Imported Wallet',
            privateKey: jsonData.privateKey || jsonData.secretKey || jsonData.key,
          },
        ];
      } else {
        toast.error('Invalid JSON format');
        return;
      }

      // Filter out invalid entries
      const validWallets = wallets.filter(
        (wallet) => wallet.privateKey && wallet.privateKey.length >= 32,
      );

      if (validWallets.length === 0) {
        toast.error('No valid wallets found in JSON');
        return;
      }

      onImport(validWallets);
      setJsonInput('');
      toast.success(`Imported ${validWallets.length} wallet(s)`);
    } catch (error) {
      toast.error('Invalid JSON format');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Import Wallets
        </CardTitle>
        <CardDescription>Import wallets using private keys or JSON data</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="privateKey" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              Private Key
            </TabsTrigger>
            <TabsTrigger value="json" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              JSON Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="privateKey" className="space-y-4">
            <div>
              <Label htmlFor="walletName">Wallet Name</Label>
              <Input
                id="walletName"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                placeholder="My Wallet"
                required
              />
            </div>

            <div>
              <Label htmlFor="privateKey">Private Key</Label>
              <Textarea
                id="privateKey"
                value={privateKeyInput}
                onChange={(e) => setPrivateKeyInput(e.target.value)}
                placeholder="Enter your private key (base58 format)"
                rows={3}
                required
              />
              <p className="text-sm text-gray-500 mt-1">Enter the private key in base58 format</p>
            </div>

            <Button
              onClick={handlePrivateKeyImport}
              disabled={isLoading || !privateKeyInput.trim() || !walletName.trim()}
              className="w-full"
            >
              {isLoading ? 'Importing...' : 'Import Wallet'}
            </Button>
          </TabsContent>

          <TabsContent value="json" className="space-y-4">
            <div>
              <Label htmlFor="jsonData">JSON Data</Label>
              <Textarea
                id="jsonData"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder={`[
  {
    "name": "Wallet 1",
    "privateKey": "your-private-key-here"
  },
  {
    "name": "Wallet 2", 
    "privateKey": "another-private-key-here"
  }
]`}
                rows={8}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter JSON array of wallet objects with name and privateKey fields
              </p>
            </div>

            <Button
              onClick={handleJsonImport}
              disabled={isLoading || !jsonInput.trim()}
              className="w-full"
            >
              {isLoading ? 'Importing...' : 'Import Wallets'}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
