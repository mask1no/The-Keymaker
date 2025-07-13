// Replace with full dashboard code
'use client';
import { GlassCard } from '@/components/UI/GlassCard';
import { BundleEngine } from '@/components/BundleEngine/BundleEngine';
import { WalletManager } from '@/components/WalletManager/WalletManager';
import { AnalyticsPanel } from '@/components/Analytics/AnalyticsPanel';
import { TokenInfo } from '@/components/MemecoinCreator/TokenInfo';
import { ExecutionResults } from '@/components/BundleEngine/ExecutionResults';
import ResponsiveGridLayout from 'react-grid-layout';
export default function Dashboard() {
  const layout = [
    { i: 'bundle', x: 0, y: 0, w: 2, h: 2 },
    { i: 'wallets', x: 2, y: 0, w: 1, h: 1 },
    { i: 'analytics', x: 0, y: 2, w: 2, h: 1 },
    { i: 'token', x: 2, y: 1, w: 1, h: 1 },
    { i: 'results', x: 0, y: 3, w: 3, h: 1 },
  ];
  return (
    <div className="relative min-h-screen">
      <video
        autoPlay
        loop
        muted
        className="absolute inset-0 object-cover opacity-20"
        src="/assets/matrix-bg.mp4"
      />
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
        cols={{ lg: 3, md: 2, sm: 1, xs: 1 }}
        rowHeight={200}
      >
        <div key="bundle"><GlassCard><BundleEngine /></GlassCard></div>
        <div key="wallets"><GlassCard><WalletManager /></GlassCard></div>
        <div key="analytics"><GlassCard><AnalyticsPanel /></GlassCard></div>
        <div key="token"><GlassCard><TokenInfo /></GlassCard></div>
        <div key="results"><GlassCard><ExecutionResults /></GlassCard></div>
      </ResponsiveGridLayout>
    </div>
  );
} 