'use client';
import { useEffect } from 'react';

export default function CsrfBootstrap() {
  useEffect(() => {
    fetch('/api/csrf').catch(() => {
      // CSRF token fetch failed - non-critical
    });
  }, []);
  return null;
}
