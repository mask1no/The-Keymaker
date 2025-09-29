'use client';

import { useState } from 'react';

interface ActionButtonsProps {
  mode: 'RPC_FANOUT' | 'JITO_BUNDLE';
  onBuy: (params: BuyParams) => Promise<void>;
  onSell: (params: SellParams) => Promise<void>;
  disabled?: boolean;
}

export interface BuyParams {
  mint: string;
  amountSol: number;
  slippageBps: number;
}

export interface SellParams {
  mint: string;
  percent: number; // 10, 25, 50, 100
  condition?: 'now' | 'timer' | 'target';
  timerMs?: number;
  targetPercent?: number;
}

export function ActionButtons({ mode, onBuy, onSell, disabled }: ActionButtonsProps) {
  const [busy, setBusy] = useState(false);
  const [mint, setMint] = useState('');
  const [amount, setAmount] = useState('0.05');
  const [slippage, setSlippage] = useState('150');
  
  const handleBuy = async () => {
    if (!mint || busy) return;
    
    setBusy(true);
    try {
      await onBuy({
        mint,
        amountSol: parseFloat(amount),
        slippageBps: parseInt(slippage),
      });
    } finally {
      setBusy(false);
    }
  };
  
  const handleSell = async (percent: number) => {
    if (!mint || busy) return;
    
    setBusy(true);
    try {
      await onSell({
        mint,
        percent,
        condition: 'now',
      });
    } finally {
      setBusy(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="card">
        <div className="label mb-3">Buy ({mode === 'RPC_FANOUT' ? 'RPC' : 'Jito'})</div>
        
        <div className="space-y-3">
          <div>
            <label className="text-sm text-zinc-400 block mb-1">Token Mint</label>
            <input
              type="text"
              value={mint}
              onChange={(e) => setMint(e.target.value)}
              placeholder="Token address (base58)"
              className="input w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-zinc-400 block mb-1">Amount SOL</label>
              <input
                type="number"
                step="0.001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg"
              />
            </div>
            
            <div>
              <label className="text-sm text-zinc-400 block mb-1">Slippage (bps)</label>
              <input
                type="number"
                value={slippage}
                onChange={(e) => setSlippage(e.target.value)}
                className="input w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg"
              />
            </div>
          </div>
          
          <button
            onClick={handleBuy}
            disabled={disabled || busy || !mint}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium rounded-lg transition-colors"
          >
            {busy ? 'Executing...' : 'Buy Now'}
          </button>
        </div>
      </div>
      
      <div className="card">
        <div className="label mb-3">Sell</div>
        
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2">
            {[10, 25, 50, 100].map(percent => (
              <button
                key={percent}
                onClick={() => handleSell(percent)}
                disabled={disabled || busy || !mint}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 disabled:text-zinc-600 text-sm font-medium rounded-lg transition-colors"
              >
                {percent}%
              </button>
            ))}
          </div>
          
          <div className="text-xs text-zinc-500 mt-2">
            Sell percentage of holdings for selected token
          </div>
        </div>
      </div>
    </div>
  );
}
