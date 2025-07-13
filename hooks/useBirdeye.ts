import { useState, useEffect } from 'react';
import axios from 'axios';
import { useDebounce } from 'use-debounce';

export function useBirdeyeMetadata(tokenAddress: string) {
  const [metadata, setMetadata] = useState(null);
  const [debouncedFetch] = useDebounce(async () => {
    const cached = localStorage.getItem(`birdeye_${tokenAddress}`);
    const timestamp = localStorage.getItem(`birdeye_ts_${tokenAddress}`);
    if (cached && timestamp && Date.now() - parseInt(timestamp) < 30000) {
      setMetadata(JSON.parse(cached));
      return;
    }
    const res = await axios.get(`https://public-api.birdeye.so/token/${tokenAddress}`, { headers: { 'X-API-KEY': process.env.NEXT_PUBLIC_BIRDEYE_API_KEY } });
    setMetadata(res.data);
    localStorage.setItem(`birdeye_${tokenAddress}`, JSON.stringify(res.data));
    localStorage.setItem(`birdeye_ts_${tokenAddress}`, Date.now().toString());
  }, 500);

  useEffect(() => {
    if (tokenAddress) debouncedFetch();
  }, [tokenAddress]);

  return metadata;
} 