'use client';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'react-hot-toast';
import { Sun, Moon, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useJitoStatus } from '@/hooks/useJitoStatus';
interface TopbarProps {
  toggleTheme: () => void;
  theme: string;
}
export function Topbar({ toggleTheme, theme }: TopbarProps) {
  const { publicKey } = useWallet();
  const { jitoStatus } = useJitoStatus();
  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
      toast.success('Address copied!');
    }
  };
  return (
    <header className="flex justify-between items-center p-4 bg-glass/30 backdrop-blur border-b border-white/10 md:hidden">
      <h1 className="text-xl font-bold">The Keymaker</h1>
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="hover:bg-aqua/20"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
        <div className="text-sm">
          {publicKey ? (
            <div className="flex items-center">
              <img src="/placeholder-avatar.png" alt="Avatar" className="w-6 h-6 rounded-full mr-2" />
              <span className="truncate max-w-[80px]">{publicKey.toBase58().slice(0, 6)}...{publicKey.toBase58().slice(-4)}</span>
              <Button variant="ghost" size="icon" onClick={copyAddress}><Copy className="w-4 h-4" /></Button>
            </div>
          ) : (
            <WalletMultiButton className="rounded-xl bg-aqua/20 hover:bg-aqua/30 text-white/90" />
          )}
        </div>
        <span className="text-sm">Jito: {jitoStatus}</span>
      </div>
    </header>
  );
} 