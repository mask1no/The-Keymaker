'use client';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Circle, Wifi, Activity, Zap } from 'lucide-react';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import toast from 'react-hot-toast';

export function StatusCluster() {
  const { rpcStatus, wsStatus, jitoStatus } = useSystemStatus();
  const [degradedCount, setDegradedCount] = useState({ rpc: 0, ws: 0, jito: 0 });
  
  // Track degraded status
  useEffect(() => {
    setDegradedCount(prev => ({
      rpc: rpcStatus === 'degraded' ? prev.rpc + 1 : 0,
      ws: wsStatus === 'degraded' ? prev.ws + 1 : 0,
      jito: jitoStatus === 'degraded' ? prev.jito + 1 : 0
    }));
    
    // Show toast if degraded for more than 3 checks (12 seconds)
    if (degradedCount.rpc > 3) {
      toast.error('RPC connection degraded');
    }
    if (degradedCount.ws > 3) {
      toast.error('WebSocket connection degraded');
    }
    if (degradedCount.jito > 3) {
      toast.error('Jito connection degraded');
    }
  }, [rpcStatus, wsStatus, jitoStatus, degradedCount]);
  
  const getStatusColor = (status: 'healthy' | 'degraded' | 'error') => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };
  
  const getStatusIcon = (name: string) => {
    switch (name) {
      case 'RPC': return <Activity className="w-4 h-4" />;
      case 'WebSocket': return <Wifi className="w-4 h-4" />;
      case 'Jito': return <Zap className="w-4 h-4" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };
  
  const statuses = [
    { name: 'RPC', status: rpcStatus },
    { name: 'WebSocket', status: wsStatus },
    { name: 'Jito', status: jitoStatus }
  ];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 left-4 flex items-center space-x-4 bg-black/80 backdrop-blur-lg rounded-lg p-3 border border-aqua/20"
    >
      {statuses.map((item) => (
        <div key={item.name} className="flex items-center space-x-2">
          <div className="relative">
            {getStatusIcon(item.name)}
            <motion.div
              animate={item.status === 'healthy' ? {
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              } : {}}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className={`absolute inset-0 ${getStatusColor(item.status)}`}
            >
              {getStatusIcon(item.name)}
            </motion.div>
          </div>
          <span className="text-sm text-gray-400">{item.name}</span>
          <Circle className={`w-3 h-3 ${getStatusColor(item.status)} ${item.status === 'healthy' ? 'animate-pulse' : ''}`} fill="currentColor" />
        </div>
      ))}
    </motion.div>
  );
} 