import { useState } from 'react';
import { useDebounce } from 'use-debounce';
import { apiClient } from '@/lib/apiClient';

export function useJupiterPrices() {
  const [prices, setPrices] = useState<{ sol: number, eth: number, btc: number, cake: number }>({ sol: 0, eth: 0, btc: 0, cake: 0 });
  
  const [debouncedFetch] = useDebounce(async () => {
    try {
      const priceData = await apiClient.jupiter.getPrice(
        'So11111111111111111111111111111111111111112,7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs,EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v,CAKEorcFfpMbRqfeYAryJr39mDY6FXYZQgN8yd7Nq5z5'
      );
      
      setPrices({
        sol: priceData['So11111111111111111111111111111111111111112']?.price || 0,
        eth: priceData['7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs']?.price || 0,
        btc: priceData['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v']?.price || 0,
        cake: priceData['CAKEorcFfpMbRqfeYAryJr39mDY6FXYZQgN8yd7Nq5z5']?.price || 0
      });
    } catch (error) {
      console.error('Failed to fetch Jupiter prices:', error);
    }
  }, 500);

  return { prices, fetchPrices: debouncedFetch };
} 