'use client';
import { useEffect } from 'react';

export default function CsrfBootstrap() {
  useEffect(() => {
    fetch('/api/csrf').catch(() => {});
  }, []);
  return null;
}


