'use client';
import { useHotkeys } from 'react-hotkeys-hook';
import { useRouter } from 'next/navigation';

export function GlobalHotkeys() {
  const router = useRouter();
  
  // ⌘+E or Ctrl+E to open Sell Monitor
  useHotkeys('meta+e,ctrl+e', (e) => {
    e.preventDefault();
    router.push('/dashboard/sell-monitor');
  }, { enableOnFormTags: true });
  
  return null;
} 