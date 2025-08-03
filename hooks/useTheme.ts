import { useState, useEffect } from 'react';
import { useKeymakerStore } from '@/lib/store';

export function useTheme() {
  const { theme: storeTheme, setTheme: setStoreTheme } = useKeymakerStore();
  const [theme, setTheme] = useState<'dark' | 'light'>(storeTheme);
  
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    const initialTheme = savedTheme || storeTheme || 'dark';
    setTheme(initialTheme);
    setStoreTheme(initialTheme);
    document.documentElement.className = initialTheme;
  }, []);
  
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    setStoreTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.className = newTheme;
  };
  
  return { theme, toggleTheme };
} 