import { useState } from 'react';
import { useDebounce } from 'use-debounce';
import { Jupiter } from '@jup-ag/api';

export function useJupiterPrices() {
  const [prices, setPrices] = useState<{ sol: number, eth: number, btc: number, cake: number }>({ sol: 0, eth: 0, btc: 0, cake: 0 });
  const [debouncedFetch] = useDebounce(async () => {
    const jupiter = await Jupiter.create({ apiKey: process.env.NEXT_PUBLIC_JUPITER_API_KEY });
    const res = await jupiter.getPrices(['SOL', 'ETH', 'BTC', 'CAKE']);
    setPrices(res);
  }, 500);

  return { prices, fetchPrices: debouncedFetch };
} 