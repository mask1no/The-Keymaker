'use client';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'react-hot-toast';
import { Sun, Moon, Copy } from 'lucide-react';
import { Button } from '@/components/UI/button';
import { useKeymakerStore } from '@/lib/store';
import { NotificationCenter } from '@/components/Notifications/NotificationCenter';

interface TopbarProps {
  toggleTheme: () => void;
  theme: string;
}

export function Topbar({ toggleTheme, theme }: TopbarProps) {
  const { publicKey } = useWallet();
  const { activeWallet, wallets } = useKeymakerStore();
  
  // Show active wallet if set, otherwise show browser wallet
  const displayWallet = activeWallet || publicKey?.toBase58() || null;
  const activeWalletData = activeWallet ? wallets.find(w => w.publicKey === activeWallet) : null;
  
  const copyAddress = () => {
    if (displayWallet) {
      navigator.clipboard.writeText(displayWallet);
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
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
        <div className="text-sm">
          {displayWallet ? (
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full mr-2 bg-gradient-to-br from-green-500/40 to-emerald-500/40" />
              <div className="flex flex-col">
                <span className="truncate max-w-[80px]">{displayWallet.slice(0, 6)}...{displayWallet.slice(-4)}</span>
                {activeWalletData && (
                  <span className="text-xs text-white/60">{activeWalletData.role}</span>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={copyAddress}
                aria-label="Copy wallet address"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <WalletMultiButton className="rounded-xl bg-green-600/20 hover:bg-green-600/30 text-white/90" />
          )}
        </div>
      </div>
    </header>
  );
} 