'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Connection } from '@solana/web3.js';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/UI/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/UI/dialog';
import { NEXT_PUBLIC_HELIUS_RPC, NEXT_PUBLIC_JITO_ENDPOINT } from '@/constants';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface HealthStatus {
  connected: boolean;
  rtt: number; // Round trip time in ms
  lastCheck: number;
}

interface HealthHistory {
  timestamp: number;
  rtt: number;
  connected: boolean;
}

const MAX_HISTORY_POINTS = 180; // 30 minutes at 10s intervals

export function StatusLEDs() {
  const [rpcStatus, setRpcStatus] = useState<HealthStatus>({ connected: false, rtt: 0, lastCheck: 0 });
  const [wsStatus, setWsStatus] = useState<HealthStatus>({ connected: false, rtt: 0, lastCheck: 0 });
  const [jitoStatus, setJitoStatus] = useState<HealthStatus>({ connected: false, rtt: 0, lastCheck: 0 });
  
  const [rpcHistory, setRpcHistory] = useState<HealthHistory[]>([]);
  const [wsHistory, setWsHistory] = useState<HealthHistory[]>([]);
  const [jitoHistory, setJitoHistory] = useState<HealthHistory[]>([]);
  
  const [selectedService, setSelectedService] = useState<'rpc' | 'ws' | 'jito' | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const connectionRef = useRef<Connection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Check RPC health
  const checkRPC = async () => {
    const start = Date.now();
    try {
      if (!connectionRef.current) {
        connectionRef.current = new Connection(NEXT_PUBLIC_HELIUS_RPC);
      }
      
      const slot = await connectionRef.current.getSlot();
      const rtt = Date.now() - start;
      
      const status = { connected: slot > 0, rtt, lastCheck: Date.now() };
      setRpcStatus(status);
      
      setRpcHistory(prev => {
        const newHistory = [...prev, { timestamp: Date.now(), rtt, connected: status.connected }];
        return newHistory.slice(-MAX_HISTORY_POINTS);
      });
    } catch (error) {
      const status = { connected: false, rtt: 0, lastCheck: Date.now() };
      setRpcStatus(status);
      setRpcHistory(prev => {
        const newHistory = [...prev, { timestamp: Date.now(), rtt: 0, connected: false }];
        return newHistory.slice(-MAX_HISTORY_POINTS);
      });
    }
  };

  // Check WebSocket health
  const checkWebSocket = () => {
    const start = Date.now();
    
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      // Try to establish WebSocket connection
      try {
        const wsUrl = NEXT_PUBLIC_HELIUS_RPC.replace('https', 'wss');
        wsRef.current = new WebSocket(wsUrl);
        
        wsRef.current.onopen = () => {
          const rtt = Date.now() - start;
          const status = { connected: true, rtt, lastCheck: Date.now() };
          setWsStatus(status);
          setWsHistory(prev => {
            const newHistory = [...prev, { timestamp: Date.now(), rtt, connected: true }];
            return newHistory.slice(-MAX_HISTORY_POINTS);
          });
        };
        
        wsRef.current.onerror = () => {
          const status = { connected: false, rtt: 0, lastCheck: Date.now() };
          setWsStatus(status);
          setWsHistory(prev => {
            const newHistory = [...prev, { timestamp: Date.now(), rtt: 0, connected: false }];
            return newHistory.slice(-MAX_HISTORY_POINTS);
          });
        };
        
        wsRef.current.onclose = () => {
          const status = { connected: false, rtt: 0, lastCheck: Date.now() };
          setWsStatus(status);
        };
      } catch (error) {
        const status = { connected: false, rtt: 0, lastCheck: Date.now() };
        setWsStatus(status);
        setWsHistory(prev => {
          const newHistory = [...prev, { timestamp: Date.now(), rtt: 0, connected: false }];
          return newHistory.slice(-MAX_HISTORY_POINTS);
        });
      }
    } else {
      // WebSocket is connected
      const rtt = Date.now() - start;
      const status = { connected: true, rtt, lastCheck: Date.now() };
      setWsStatus(status);
      setWsHistory(prev => {
        const newHistory = [...prev, { timestamp: Date.now(), rtt, connected: true }];
        return newHistory.slice(-MAX_HISTORY_POINTS);
      });
    }
  };

  // Check Jito health
  const checkJito = async () => {
    const start = Date.now();
    try {
      // Jito doesn't have a direct health endpoint, so we'll try to connect
      const response = await fetch(NEXT_PUBLIC_JITO_ENDPOINT + '/api/v1/bundles', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const rtt = Date.now() - start;
      const connected = response.ok || response.status === 400; // 400 is expected without auth
      
      const status = { connected, rtt, lastCheck: Date.now() };
      setJitoStatus(status);
      
      setJitoHistory(prev => {
        const newHistory = [...prev, { timestamp: Date.now(), rtt, connected }];
        return newHistory.slice(-MAX_HISTORY_POINTS);
      });
    } catch (error) {
      const status = { connected: false, rtt: 0, lastCheck: Date.now() };
      setJitoStatus(status);
      setJitoHistory(prev => {
        const newHistory = [...prev, { timestamp: Date.now(), rtt: 0, connected: false }];
        return newHistory.slice(-MAX_HISTORY_POINTS);
      });
    }
  };

  // Run health checks
  useEffect(() => {
    // Initial checks
    checkRPC();
    checkWebSocket();
    checkJito();

    // Set up interval for periodic checks (every 8 seconds)
    const interval = setInterval(() => {
      checkRPC();
      checkWebSocket();
      checkJito();
    }, 8000);

    return () => {
      clearInterval(interval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const handleLEDClick = (service: 'rpc' | 'ws' | 'jito') => {
    setSelectedService(service);
    setDialogOpen(true);
  };

  const getHistoryData = () => {
    switch (selectedService) {
      case 'rpc':
        return rpcHistory;
      case 'ws':
        return wsHistory;
      case 'jito':
        return jitoHistory;
      default:
        return [];
    }
  };

  const LED = ({ status, label, onClick }: { status: HealthStatus; label: string; onClick: () => void }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            onClick={onClick}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white/5 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className={`h-2.5 w-2.5 rounded-full ${
                status.connected ? 'bg-green-500' : 'bg-red-500'
              }`}
              animate={{
                boxShadow: status.connected
                  ? ['0 0 0 0 rgba(34, 197, 94, 0.4)', '0 0 0 8px rgba(34, 197, 94, 0)']
                  : ['0 0 0 0 rgba(239, 68, 68, 0.4)', '0 0 0 8px rgba(239, 68, 68, 0)'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
            <span className="text-xs text-white/70">{label}</span>
          </motion.button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <p>Status: {status.connected ? 'Connected' : 'Disconnected'}</p>
            {status.connected && <p>RTT: {status.rtt}ms</p>}
            <p>Last check: {new Date(status.lastCheck).toLocaleTimeString()}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <>
      <div className="flex items-center gap-2">
        <LED status={rpcStatus} label="RPC" onClick={() => handleLEDClick('rpc')} />
        <LED status={wsStatus} label="WS" onClick={() => handleLEDClick('ws')} />
        <LED status={jitoStatus} label="Jito" onClick={() => handleLEDClick('jito')} />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedService?.toUpperCase()} Connection History (30 min)
            </DialogTitle>
          </DialogHeader>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getHistoryData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(time) => new Date(time).toLocaleTimeString()}
                  stroke="#666"
                />
                <YAxis stroke="#666" />
                <Line
                  type="monotone"
                  dataKey="rtt"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-sm text-white/60">
            <span>
              Avg RTT: {
                getHistoryData().length > 0
                  ? Math.round(
                      getHistoryData().reduce((acc, h) => acc + h.rtt, 0) / getHistoryData().length
                    )
                  : 0
              }ms
            </span>
            <span>
              Uptime: {
                getHistoryData().length > 0
                  ? Math.round(
                      (getHistoryData().filter(h => h.connected).length / getHistoryData().length) * 100
                    )
                  : 0
              }%
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 