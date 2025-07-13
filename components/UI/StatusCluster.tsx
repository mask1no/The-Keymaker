'use client';
import { useEffect, useState } from 'react';
import { Connection } from '@solana/web3.js';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Circle } from 'lucide-react';
import { useSystemStatus } from '@/hooks/useSystemStatus';
interface Status {
  name: string;
  status: 'green' | 'yellow' | 'red';
  isBundling?: boolean;
}
export function StatusCluster() {
  const { rpcStatus, wsStatus, jitoStatus } = useSystemStatus();
  const [statuses, setStatuses] = useState<Status[]>([
    { name: 'RPC', status: rpcStatus, isBundling: false },
    { name: 'WebSocket', status: wsStatus, isBundling: false },
    { name: 'Jito', status: jitoStatus, isBundling: false },
  ]);
  useEffect(() => {
    const checkStatus = async () => {
      const connection = new Connection(process.env.NEXT_PUBLIC_HELIUS_RPC || 'https://api.devnet.solana.com');
      const jitoCheck = async () => {
        try {
          const response = await fetch(process.env.NEXT_PUBLIC_JITO_ENDPOINT || 'https://devnet.jito.wtf');
          return response.ok ? 'green' : 'yellow';
        } catch {
          return 'red';
        }
      };
      const newStatuses = [
        { name: 'RPC', status: (await connection.getHealth()) === 'ok' ? 'green' : 'red' },
        { name: 'WebSocket', status: connection._rpcWebSocketConnected ? 'green' : 'red' },
        { name: 'Jito', status: await jitoCheck() },
      ];
      setStatuses(newStatuses);
      const hasError = newStatuses.some(s => s.status === 'red');
      if (hasError) toast.error('Connection issue detected');
    };
    checkStatus();
    const interval = setInterval(checkStatus, 4000);
    return () => clearInterval(interval);
  }, []);
  // Map 'healthy' to 'green' etc.
  const mapStatus = (s: Status) => s === 'healthy' ? 'green' : s === 'degraded' ? 'yellow' : 'red';
  return (
    <div className="fixed bottom-4 left-4 bg-glass/30 backdrop-blur border border-white/10 rounded-xl p-2">
      {statuses.map(status => (
        <motion.div
          key={status.name}
          animate={status.isBundling ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 1, repeat: status.isBundling ? Infinity : 0 }}
          className="flex items-center space-x-2"
        >
          <Circle className={`w-3 h-3 ${mapStatus(status.status)}`} />
          <span>{status.name}</span>
        </motion.div>
      ))}
    </div>
  );
} 