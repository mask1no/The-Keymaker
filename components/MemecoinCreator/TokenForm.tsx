'use client';
import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Coins, Image, Globe, MessageCircle, Twitter } from 'lucide-react';
import { Input } from '@/components/UI/input';
import { Button } from '@/components/UI/button';
import { Label } from '@/components/UI/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/UI/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card';
import { Badge } from '@/components/UI/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/UI/dialog';
import { createToken as pumpfunCreate } from '../../services/pumpfunService';
// import { createToken as letsbonkCreate } from '../../services/letsbonkService';
import { createToken as moonshotCreate } from '../../services/moonshotService';
import { useKeymakerStore } from '@/lib/store';

export default function TokenForm() {
  const { publicKey } = useWallet();
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [deployedToken, setDeployedToken] = useState<string | null>(null);
  
  // Zustand store
  const { setTokenLaunchData } = useKeymakerStore();
  
  // Form fields
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [supply, setSupply] = useState('1000000000');
  const [decimals, setDecimals] = useState('9');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [telegram, setTelegram] = useState('');
  const [website, setWebsite] = useState('');
  const [twitter, setTwitter] = useState('');
  const [platform, setPlatform] = useState('Pump.fun');

  const validateForm = (): boolean => {
    if (!name || name.length > 32) {
      toast.error('Name is required and must be 32 characters or less');
      return false;
    }
    
    if (!symbol || symbol.length > 10) {
      toast.error('Symbol is required and must be 10 characters or less');
      return false;
    }
    
    if (!supply || parseInt(supply) <= 0) {
      toast.error('Supply must be greater than 0');
      return false;
    }
    
    if (parseInt(decimals) < 0 || parseInt(decimals) > 18) {
      toast.error('Decimals must be between 0 and 18');
      return false;
    }
    
    if (image && !isValidUrl(image)) {
      toast.error('Invalid image URL');
      return false;
    }
    
    return true;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const metadata = { 
    name, 
    symbol, 
    description,
    image, 
    telegram, 
    website, 
    twitter 
  };

  const handleDeploy = async () => {
    if (!publicKey) {
      return toast.error('Connect wallet first');
    }
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      let tokenAddr: string;
      
      // Update global store with token launch data
      setTokenLaunchData({
        name,
        symbol,
        decimals: parseInt(decimals),
        supply: parseInt(supply),
        platform: platform.toLowerCase().replace('.', '') as any,
        lpAmount: 1, // Default LP amount
        walletPublicKey: publicKey.toString()
      });
      
      switch (platform) {
        case 'Raydium': {
          // For Raydium, we need to prompt for wallet password
          const password = prompt('Enter wallet password to create token:');
          if (!password) {
            throw new Error('Password required to create token');
          }
          
          // Raydium requires a full keypair which isn't available with browser wallets
          // Direct users to use other platforms or import a wallet
          throw new Error('Raydium token creation requires an imported wallet with decryptable keypair. Please use Pump.fun or other platforms.');
        }
          
        case 'Pump.fun':
          tokenAddr = await pumpfunCreate(name, symbol, parseInt(supply), metadata);
          break;
          
        case 'LetsBonk.fun':
          // TODO: This component needs to be updated to use the new wallet system
          // tokenAddr = await letsbonkCreate(name, symbol, parseInt(supply), metadata);
          throw new Error('LetsBonk.fun integration requires wallet system - use Control Panel instead');
          break;
          
        case 'Moonshot':
          tokenAddr = await moonshotCreate(name, symbol, parseInt(supply), metadata);
          break;
          
        default:
          throw new Error('Invalid platform selected');
      }
      
      setDeployedToken(tokenAddr);
      toast.success(`Token deployed successfully!`);
      
      // Reset form
      setName('');
      setSymbol('');
      setSupply('1000000000');
      setDescription('');
      setImage('');
      setTelegram('');
      setWebsite('');
      setTwitter('');
      
    } catch (error: any) {
      console.error('Deployment error:', error);
      toast.error(error.message || 'Deployment failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    if (!validateForm()) {
      return;
    }
    setShowPreview(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <>
      <Card className="bg-black/40 backdrop-blur-xl border-aqua/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-6 h-6" />
            Create Memecoin
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Name *</Label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="My Awesome Token"
                maxLength={32}
                className="bg-black/50 border-aqua/30"
              />
              <span className="text-xs text-gray-400">{name.length}/32</span>
            </div>
            
            <div>
              <Label>Symbol *</Label>
              <Input 
                value={symbol} 
                onChange={(e) => setSymbol(e.target.value.toUpperCase())} 
                placeholder="TOKEN"
                maxLength={10}
                className="bg-black/50 border-aqua/30"
              />
              <span className="text-xs text-gray-400">{symbol.length}/10</span>
            </div>
            
            <div>
              <Label>Supply *</Label>
              <Input 
                type="number" 
                value={supply} 
                onChange={(e) => setSupply(e.target.value)} 
                placeholder="1000000000"
                className="bg-black/50 border-aqua/30"
              />
            </div>
            
            <div>
              <Label>Decimals</Label>
              <Input 
                type="number" 
                value={decimals} 
                onChange={(e) => setDecimals(e.target.value)} 
                placeholder="9"
                min="0"
                max="18"
                className="bg-black/50 border-aqua/30"
              />
            </div>
            
            <div className="md:col-span-2">
              <Label>Description</Label>
              <Input 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="A brief description of your token"
                className="bg-black/50 border-aqua/30"
              />
            </div>
            
            <div className="md:col-span-2">
              <Label>Image URL</Label>
              <div className="flex gap-2">
                <Image className="w-5 h-5 text-gray-400 mt-2" />
                <Input 
                  value={image} 
                  onChange={(e) => setImage(e.target.value)} 
                  placeholder="https://example.com/logo.png"
                  className="bg-black/50 border-aqua/30"
                />
              </div>
            </div>
            
            <div>
              <Label>Telegram</Label>
              <div className="flex gap-2">
                <MessageCircle className="w-5 h-5 text-gray-400 mt-2" />
                <Input 
                  value={telegram} 
                  onChange={(e) => setTelegram(e.target.value)} 
                  placeholder="t.me/mytoken"
                  className="bg-black/50 border-aqua/30"
                />
              </div>
            </div>
            
            <div>
              <Label>Website</Label>
              <div className="flex gap-2">
                <Globe className="w-5 h-5 text-gray-400 mt-2" />
                <Input 
                  value={website} 
                  onChange={(e) => setWebsite(e.target.value)} 
                  placeholder="https://mytoken.com"
                  className="bg-black/50 border-aqua/30"
                />
              </div>
            </div>
            
            <div>
              <Label>Twitter/X</Label>
              <div className="flex gap-2">
                <Twitter className="w-5 h-5 text-gray-400 mt-2" />
                <Input 
                  value={twitter} 
                  onChange={(e) => setTwitter(e.target.value)} 
                  placeholder="@mytoken"
                  className="bg-black/50 border-aqua/30"
                />
              </div>
            </div>
            
            <div>
              <Label>Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="bg-black/50 border-aqua/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pump.fun">Pump.fun</SelectItem>
                  <SelectItem value="Raydium">Raydium</SelectItem>
                  <SelectItem value="LetsBonk.fun">LetsBonk.fun</SelectItem>
                  <SelectItem value="Moonshot">Moonshot</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handlePreview} 
              variant="outline"
              disabled={loading}
            >
              Preview Token
            </Button>
            <Button 
              onClick={handleDeploy}
              disabled={loading || !publicKey}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                  Deploying...
                </>
              ) : (
                'Deploy Token'
              )}
            </Button>
          </div>
          
          {deployedToken && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg"
            >
              <h4 className="font-semibold text-green-500 mb-2">Token Deployed Successfully!</h4>
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm">{deployedToken}</span>
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(deployedToken)}>
                  Copy
                </Button>
              </div>
              <div className="mt-2 flex gap-2">
                <a
                  href={`https://solscan.io/token/${deployedToken}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-aqua hover:underline text-sm"
                >
                  View on Solscan →
                </a>
                <a
                  href={`https://birdeye.so/token/${deployedToken}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-aqua hover:underline text-sm"
                >
                  View on Birdeye →
                </a>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
      
      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="bg-black/90 border-aqua/30">
          <DialogHeader>
            <DialogTitle>Token Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {image && (
              <img 
                src={image} 
                alt={name} 
                className="w-24 h-24 rounded-full mx-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <div className="text-center">
              <h3 className="text-2xl font-bold">{name}</h3>
              <Badge className="mt-1">{symbol}</Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Supply:</span>
                <span>{parseInt(supply).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Decimals:</span>
                <span>{decimals}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Platform:</span>
                <Badge variant="outline">{platform}</Badge>
              </div>
              {description && (
                <div className="pt-2">
                  <span className="text-gray-400">Description:</span>
                  <p className="mt-1">{description}</p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                {telegram && (
                  <a href={telegram} target="_blank" rel="noopener noreferrer" className="text-aqua hover:underline text-sm">
                    Telegram
                  </a>
                )}
                {website && (
                  <a href={website} target="_blank" rel="noopener noreferrer" className="text-aqua hover:underline text-sm">
                    Website
                  </a>
                )}
                {twitter && (
                  <a href={`https://twitter.com/${twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-aqua hover:underline text-sm">
                    Twitter
                  </a>
                )}
              </div>
            </div>
            <Button onClick={() => setShowPreview(false)} className="w-full">
              Close Preview
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 