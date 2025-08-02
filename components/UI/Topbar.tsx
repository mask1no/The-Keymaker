'use client';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'react-hot-toast';
import { Sun, Moon, Copy } from 'lucide-react';
import { Button } from '@/components/UI/button';

import { NotificationCenter } from '@/components/Notifications/NotificationCenter';

interface TopbarProps {
  toggleTheme: () => void;
  theme: string;
}

export function Topbar({ toggleTheme, theme }: TopbarProps) {
  const { publicKey } = useWallet();
  
  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
      toast.success('Address copied!');
    }
  };
  
  return (
    <header className="flex justify-between items-center p-4 bg-glass/30 backdrop-blur border-b border-white/10">
      <h1 className="text-xl font-bold text-gradient-green">The Keymaker</h1>
      <div className="flex items-center space-x-4">

        <NotificationCenter />
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="hover:bg-green-500/20"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
        <div className="text-sm">
          {publicKey ? (
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full mr-2 bg-gradient-to-br from-green-500/40 to-emerald-500/40" />
              <span className="truncate max-w-[80px]">{publicKey.toBase58().slice(0, 6)}...{publicKey.toBase58().slice(-4)}</span>
              <Button variant="ghost" size="icon" onClick={copyAddress}><Copy className="w-4 h-4" /></Button>
            </div>
          ) : (
            <WalletMultiButton className="rounded-xl bg-green-600/20 hover:bg-green-600/30 text-white/90" />
          )}
        </div>
      </div>
    </header>
  );
} 