import './globals.css';
import type { Metadata, Viewport } from 'next';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Keymaker', description: 'Local Solana bundler cockpit' };
export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body className="min-h-screen bg-black text-zinc-100">{children}</body></html>);
}