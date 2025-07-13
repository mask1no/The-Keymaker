import { useState, useEffect } from 'react';
export function useJitoStatus() {
  const [jitoStatus, setJitoStatus] = useState<'Connected' | 'Fallback' | 'Disconnected' | 'Unknown'>('Unknown');
  useEffect(() => {
    const checkJito = async () => {
      try {
        const response = await fetch(process.env.NEXT_PUBLIC_JITO_ENDPOINT || 'https://devnet.jito.wtf');
        setJitoStatus(response.ok ? 'Connected' : 'Fallback');
      } catch {
        setJitoStatus('Disconnected');
      }
    };
    checkJito();
    const interval = setInterval(checkJito, 4000);
    return () => clearInterval(interval);
  }, []);
  return { jitoStatus };
} 