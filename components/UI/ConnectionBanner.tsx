'use client';
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, WifiOff, RefreshCw } from 'lucide-react';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { useConnectionStore } from '@/lib/store/connectionStore';
import { Button } from '@/components/UI/button';

export function ConnectionBanner() {
  const { rpcStatus, wsStatus, jitoStatus } = useSystemStatus();
  const {
    rpcDown,
    wsDown,
    jitoDown,
    mainnetDown,
    retryInSeconds,
    setRpcDown,
    setWsDown,
    setJitoDown,
    setMainnetDown,
    setRetryInSeconds,
    isAnyServiceDown
  } = useConnectionStore();

  const [isRetrying, setIsRetrying] = useState(false);
  const [mainnetStatus, setMainnetStatus] = useState<'healthy' | 'error'>('healthy');

  // Update connection store based on system status
  useEffect(() => {
    setRpcDown(rpcStatus === 'error');
    setWsDown(wsStatus === 'error');
    setJitoDown(jitoStatus === 'error');
  }, [rpcStatus, wsStatus, jitoStatus, setRpcDown, setWsDown, setJitoDown]);

  // Check mainnet status
  useEffect(() => {
    const checkMainnet = async () => {
      try {
        const response = await fetch('https://api.mainnet-beta.solana.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getHealth'
          })
        });
        const data = await response.json();
        const isHealthy = data.result === 'ok';
        setMainnetStatus(isHealthy ? 'healthy' : 'error');
        setMainnetDown(!isHealthy);
      } catch (error) {
        setMainnetStatus('error');
        setMainnetDown(true);
      }
    };

    checkMainnet();
    const interval = setInterval(checkMainnet, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [setMainnetDown]);

  // Countdown timer for retry
  useEffect(() => {
    if (retryInSeconds > 0) {
      const timer = setTimeout(() => {
        setRetryInSeconds(retryInSeconds - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [retryInSeconds, setRetryInSeconds]);

  // Listen for manual retry events
  useEffect(() => {
    const handleCheckConnections = () => {
      // Trigger re-check of all services
      window.location.reload(); // Simple approach - refresh to re-check all connections
    };

    window.addEventListener('check-connections', handleCheckConnections);
    return () => window.removeEventListener('check-connections', handleCheckConnections);
  }, []);

  const getDownServices = () => {
    const services = [];
    if (rpcDown) services.push('RPC');
    if (wsDown) services.push('WebSocket');
    if (jitoDown) services.push('Jito Engine');
    if (mainnetDown) services.push('Solana Mainnet');
    return services;
  };

  const handleRetry = () => {
    setIsRetrying(true);
    setRetryInSeconds(10); // Start 10 second countdown
    
    // Trigger a re-check of all services
    window.dispatchEvent(new CustomEvent('check-connections'));
    
    setTimeout(() => {
      setIsRetrying(false);
    }, 2000);
  };

  const downServices = getDownServices();
  const showBanner = isAnyServiceDown();

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-50 bg-red-500/90 backdrop-blur-sm border-b border-red-600"
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <WifiOff className="w-5 h-5 text-white animate-pulse" />
                <div className="text-white">
                  <span className="font-semibold">Connection Issues: </span>
                  <span className="text-red-100">
                    {downServices.length === 1 
                      ? `${downServices[0]} is down`
                      : `${downServices.slice(0, -1).join(', ')} and ${downServices.slice(-1)} are down`
                    }
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {retryInSeconds > 0 && (
                  <span className="text-sm text-red-100">
                    Retrying in {retryInSeconds}s...
                  </span>
                )}
                
                <Button
                  onClick={handleRetry}
                  disabled={isRetrying || retryInSeconds > 0}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-red-600/50 disabled:opacity-50"
                >
                  {isRetrying ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Retry Now
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}