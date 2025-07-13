import { useState, useEffect } from 'react';
import { Connection } from '@solana/web3.js';
import { NEXT_PUBLIC_HELIUS_RPC, NEXT_PUBLIC_JITO_ENDPOINT } from '../constants';

type Status = 'healthy' | 'degraded' | 'error';

export function useSystemStatus() {
  const [rpcStatus, setRpcStatus] = useState<Status>('healthy');
  const [wsStatus, setWsStatus] = useState<Status>('healthy');
  const [jitoStatus, setJitoStatus] = useState<Status>('healthy');

  useEffect(() => {
    const checkStatus = async () => {
      // Check RPC
      try {
        const conn = new Connection(NEXT_PUBLIC_HELIUS_RPC);
        await conn.getLatestBlockhash();
        setRpcStatus('healthy');
      } catch {
        setRpcStatus('error');
      }

      // Check WebSocket (simple open/close test)
      try {
        const ws = new WebSocket(NEXT_PUBLIC_HELIUS_RPC.replace('https', 'wss'));
        ws.onopen = () => { ws.close(); setWsStatus('healthy'); };
        ws.onerror = () => setWsStatus('error');
      } catch {
        setWsStatus('error');
      }

      // Check Jito
      try {
        const res = await fetch(NEXT_PUBLIC_JITO_ENDPOINT);
        if (res.ok) setJitoStatus('healthy'); else setJitoStatus('degraded');
      } catch {
        setJitoStatus('error');
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  return { rpcStatus, wsStatus, jitoStatus };
} 